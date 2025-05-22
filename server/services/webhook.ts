import crypto from 'crypto';
import axios from 'axios';
import type { Webhook, Conversation, Order, Message } from '@shared/schema';

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  conversationId?: number;
  customerId?: string;
}

export class WebhookService {
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async triggerWebhook(webhook: Webhook, payload: WebhookPayload): Promise<boolean> {
    try {
      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString, webhook.secret);

      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'SalesBot-AI-Webhook/1.0',
        },
        timeout: 30000,
      });

      if (response.status >= 200 && response.status < 300) {
        console.log(`Webhook ${webhook.id} triggered successfully for event: ${payload.event}`);
        return true;
      } else {
        console.error(`Webhook ${webhook.id} failed with status: ${response.status}`);
        return false;
      }

    } catch (error) {
      console.error(`Webhook ${webhook.id} error:`, error);
      return false;
    }
  }

  async triggerConversationStarted(conversation: Conversation, webhooks: Webhook[]): Promise<void> {
    const payload: WebhookPayload = {
      event: 'conversation.started',
      timestamp: new Date().toISOString(),
      data: {
        conversationId: conversation.id,
        sessionId: conversation.sessionId,
        customerId: conversation.customerId,
        customerName: conversation.customerName,
        context: conversation.context,
      },
      conversationId: conversation.id,
      customerId: conversation.customerId || undefined,
    };

    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.isActive && 
      Array.isArray(webhook.events) && 
      webhook.events.includes('conversation.started')
    );

    await Promise.all(
      relevantWebhooks.map(webhook => this.triggerWebhook(webhook, payload))
    );
  }

  async triggerConversationCompleted(conversation: Conversation, webhooks: Webhook[]): Promise<void> {
    const payload: WebhookPayload = {
      event: 'conversation.completed',
      timestamp: new Date().toISOString(),
      data: {
        conversationId: conversation.id,
        sessionId: conversation.sessionId,
        customerId: conversation.customerId,
        status: conversation.status,
        context: conversation.context,
      },
      conversationId: conversation.id,
      customerId: conversation.customerId || undefined,
    };

    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.isActive && 
      Array.isArray(webhook.events) && 
      webhook.events.includes('conversation.completed')
    );

    await Promise.all(
      relevantWebhooks.map(webhook => this.triggerWebhook(webhook, payload))
    );
  }

  async triggerOrderCreated(order: Order, webhooks: Webhook[]): Promise<void> {
    const payload: WebhookPayload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      data: {
        orderId: order.id,
        shopifyId: order.shopifyId,
        customerId: order.customerId,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        currency: order.currency,
        source: order.source,
        lineItems: order.lineItems,
      },
      conversationId: order.conversationId || undefined,
      customerId: order.customerId || undefined,
    };

    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.isActive && 
      Array.isArray(webhook.events) && 
      webhook.events.includes('order.created')
    );

    await Promise.all(
      relevantWebhooks.map(webhook => this.triggerWebhook(webhook, payload))
    );
  }

  async triggerUpsellSuccess(order: Order, originalOrderValue: number, webhooks: Webhook[]): Promise<void> {
    const payload: WebhookPayload = {
      event: 'upsell.success',
      timestamp: new Date().toISOString(),
      data: {
        orderId: order.id,
        customerId: order.customerId,
        originalValue: originalOrderValue,
        finalValue: order.totalAmount,
        upliftAmount: Number(order.totalAmount) - originalOrderValue,
        source: order.source,
      },
      conversationId: order.conversationId || undefined,
      customerId: order.customerId || undefined,
    };

    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.isActive && 
      Array.isArray(webhook.events) && 
      webhook.events.includes('upsell.success')
    );

    await Promise.all(
      relevantWebhooks.map(webhook => this.triggerWebhook(webhook, payload))
    );
  }

  async triggerConversationEscalated(conversation: Conversation, reason: string, webhooks: Webhook[]): Promise<void> {
    const payload: WebhookPayload = {
      event: 'conversation.escalated',
      timestamp: new Date().toISOString(),
      data: {
        conversationId: conversation.id,
        sessionId: conversation.sessionId,
        customerId: conversation.customerId,
        customerName: conversation.customerName,
        reason,
        context: conversation.context,
      },
      conversationId: conversation.id,
      customerId: conversation.customerId || undefined,
    };

    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.isActive && 
      Array.isArray(webhook.events) && 
      webhook.events.includes('conversation.escalated')
    );

    await Promise.all(
      relevantWebhooks.map(webhook => this.triggerWebhook(webhook, payload))
    );
  }

  verifyIncomingWebhook(body: string, signature: string, secret: string): boolean {
    return this.verifySignature(body, signature, secret);
  }

  async testWebhook(webhook: Webhook): Promise<boolean> {
    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook from SalesBot AI',
        webhookId: webhook.id,
      },
    };

    return await this.triggerWebhook(webhook, testPayload);
  }

  generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const webhookService = new WebhookService();
