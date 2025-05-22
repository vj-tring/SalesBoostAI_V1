import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { shopifyService } from "./services/shopify";
import { webhookService } from "./services/webhook";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
});

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  description: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const openaiTest = process.env.OPENAI_API_KEY ? true : false;
      const shopifyTest = shopifyService.isServiceConfigured() ? 
        await shopifyService.testConnection() : false;
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          openai: openaiTest,
          shopify: shopifyTest,
          database: true,
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: (error as Error).message
      });
    }
  });

  // Get dashboard metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      await storage.recordApiMetric("dashboard", "/metrics");
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get active conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getActiveConversations();
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conversation) => {
          const messages = await storage.getMessagesByConversation(conversation.id);
          return {
            ...conversation,
            lastMessage: messages[messages.length - 1]?.content || conversation.lastMessage,
            messageCount: messages.length,
          };
        })
      );
      res.json(conversationsWithMessages);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get conversation details
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversation(conversationId);
      const recommendations = await storage.getRecommendationsByConversation(conversationId);
      
      res.json({
        conversation,
        messages,
        recommendations,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Send message and get AI response
  app.post("/api/conversations/message", async (req, res) => {
    try {
      const { message, sessionId, customerId, customerName } = messageSchema.parse(req.body);
      
      // Get or create conversation
      let conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        conversation = await storage.createConversation({
          sessionId,
          customerId,
          customerName,
          status: "active",
          lastMessage: message,
        });

        // Trigger webhook for conversation started
        const webhooks = await storage.getActiveWebhooks();
        await webhookService.triggerConversationStarted(conversation, webhooks);
      }

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
      });

      // Get conversation context
      const messages = await storage.getMessagesByConversation(conversation.id);
      const availableProducts = await storage.getActiveProducts();
      
      // Get customer context if available
      let customerContext;
      if (customerId) {
        const customerOrders = await storage.getOrdersByCustomer(customerId);
        const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        
        customerContext = {
          orderHistory: customerOrders,
          lifetimeValue: totalSpent,
          tier: totalSpent > 1000 ? "Gold" : totalSpent > 500 ? "Silver" : "Standard",
        };
      }

      // Process with AI
      const aiResponse = await openaiService.processMessage(message, {
        conversation,
        messages,
        customerContext,
        availableProducts,
      });

      // Save AI response
      const assistantMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse.message,
        metadata: {
          intent: aiResponse.intent,
          urgency: aiResponse.urgency,
          recommendations: aiResponse.recommendations,
        },
      });

      // Save recommendations
      if (aiResponse.recommendations) {
        for (const rec of aiResponse.recommendations) {
          await storage.createRecommendation({
            conversationId: conversation.id,
            productId: rec.productId,
            type: rec.type,
            confidence: rec.confidence.toString(),
            reason: rec.reason,
            presented: true,
          });
        }
      }

      // Update conversation
      await storage.updateConversation(conversation.id, {
        lastMessage: message,
        status: aiResponse.shouldEscalate ? "escalated" : "active",
      });

      // Check for escalation
      if (aiResponse.shouldEscalate) {
        const webhooks = await storage.getActiveWebhooks();
        await webhookService.triggerConversationEscalated(
          conversation, 
          "AI determined escalation needed", 
          webhooks
        );
      }

      await storage.recordApiMetric("openai", "/chat");

      res.json({
        message: aiResponse.message,
        recommendations: aiResponse.recommendations,
        intent: aiResponse.intent,
        urgency: aiResponse.urgency,
        messageId: assistantMessage.id,
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get products
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, limit } = req.query;
      let products;

      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getActiveProducts();
      }

      if (limit) {
        products = products.slice(0, parseInt(limit as string));
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Sync products from Shopify
  app.post("/api/products/sync", async (req, res) => {
    try {
      const shopifyProducts = await shopifyService.syncProducts();
      const syncedProducts = await storage.syncProducts(shopifyProducts);
      
      await storage.recordApiMetric("shopify", "/products/sync");
      
      res.json({
        message: "Products synced successfully",
        count: syncedProducts.length,
        products: syncedProducts,
      });
    } catch (error) {
      console.error("Product sync error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get orders
  app.get("/api/orders", async (req, res) => {
    try {
      const { customer, limit } = req.query;
      let orders;

      if (customer) {
        orders = await storage.getOrdersByCustomer(customer as string);
      } else {
        orders = await storage.getRecentOrders(
          limit ? parseInt(limit as string) : 50
        );
      }

      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      const order = await storage.createOrder(orderData);
      
      // Trigger webhook for order created
      const webhooks = await storage.getActiveWebhooks();
      await webhookService.triggerOrderCreated(order, webhooks);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get webhooks
  app.get("/api/webhooks", async (req, res) => {
    try {
      const webhooks = await storage.getAllWebhooks();
      res.json(webhooks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create webhook
  app.post("/api/webhooks", async (req, res) => {
    try {
      const { url, events, description } = webhookSchema.parse(req.body);
      
      const webhook = await storage.createWebhook({
        url,
        events,
        description,
        secret: webhookService.generateWebhookSecret(),
        isActive: true,
      });

      res.json(webhook);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Test webhook
  app.post("/api/webhooks/:id/test", async (req, res) => {
    try {
      const webhookId = parseInt(req.params.id);
      const webhook = await storage.getWebhook(webhookId);
      
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      const success = await webhookService.testWebhook(webhook);
      
      if (success) {
        await storage.updateWebhook(webhookId, { lastTriggered: new Date() });
      }

      res.json({ success, message: success ? "Webhook test successful" : "Webhook test failed" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get recommendations analytics
  app.get("/api/analytics/recommendations", async (req, res) => {
    try {
      const topProducts = await storage.getTopRecommendedProducts(10);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Webhook endpoint for third-party integrations
  app.post("/api/webhook/chat", async (req, res) => {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const secret = req.headers['x-webhook-secret'] as string;
      
      if (!signature || !secret) {
        return res.status(401).json({ error: "Missing webhook signature or secret" });
      }

      const body = JSON.stringify(req.body);
      const isValid = webhookService.verifyIncomingWebhook(body, signature, secret);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      // Process webhook payload
      const { customer_id, message, context, session_id } = req.body;
      
      if (!message || !session_id) {
        return res.status(400).json({ error: "Missing required fields: message, session_id" });
      }

      // Process the message using the same logic as the direct chat endpoint
      let conversation = await storage.getConversationBySessionId(session_id);
      if (!conversation) {
        conversation = await storage.createConversation({
          sessionId: session_id,
          customerId: customer_id,
          status: "active",
          lastMessage: message,
          context: context,
        });
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
      });

      const messages = await storage.getMessagesByConversation(conversation.id);
      const availableProducts = await storage.getActiveProducts();

      const aiResponse = await openaiService.processMessage(message, {
        conversation,
        messages,
        customerContext: context,
        availableProducts,
      });

      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse.message,
        metadata: {
          intent: aiResponse.intent,
          urgency: aiResponse.urgency,
          recommendations: aiResponse.recommendations,
        },
      });

      await storage.recordApiMetric("webhook", "/chat");

      res.json({
        response: aiResponse.message,
        recommendations: aiResponse.recommendations,
        session_id: session_id,
        conversation_id: conversation.id,
      });

    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time updates (only in production)
  if (process.env.NODE_ENV === 'production') {
    const wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws-api'  // Use specific path to avoid conflicts
    });

    wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received WebSocket message:', data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });
  }

  return httpServer;
}
