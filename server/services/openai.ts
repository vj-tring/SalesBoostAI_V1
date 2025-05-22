import OpenAI from "openai";
import type { Conversation, Message, Product, InsertRecommendation } from "@shared/schema";
import dotenv from "dotenv";
dotenv.config();
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
console.log("OpenAI API key:", process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "");
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

interface ChatContext {
  conversation: Conversation;
  messages: Message[];
  customerContext?: {
    orderHistory?: any[];
    preferences?: string[];
    tier?: string;
    lifetimeValue?: number;
  };
  availableProducts?: Product[];
}

interface AIResponse {
  message: string;
  recommendations?: {
    productId: number;
    type: 'cross_sell' | 'upsell' | 'primary';
    confidence: number;
    reason: string;
  }[];
  intent?: 'product_inquiry' | 'order_support' | 'complaint' | 'general';
  urgency?: 'low' | 'medium' | 'high';
  shouldEscalate?: boolean;
}

export class OpenAIService {
  private async generateSystemPrompt(context: ChatContext): Promise<string> {
    return `You are an expert AI sales agent for an e-commerce platform. Your goal is to help customers find products, increase sales through intelligent cross-selling and up-selling, and provide excellent customer service.

CONTEXT:
- Customer: ${context.conversation.customerName || 'Guest'}
- Session ID: ${context.conversation.sessionId}
- Customer Tier: ${context.customerContext?.tier || 'Standard'}
- Lifetime Value: $${context.customerContext?.lifetimeValue || 0}

AVAILABLE PRODUCTS:
${context.availableProducts?.slice(0, 10).map(p => 
  `- ${p.title}: $${p.price} (ID: ${p.id}) - ${p.description?.slice(0, 100) || 'No description'}`
).join('\n') || 'No products available'}

GUIDELINES:
1. Be helpful, friendly, and professional
2. Understand customer needs before recommending products
3. Suggest relevant cross-sells and up-sells naturally
4. Provide specific product recommendations with reasoning
5. Handle order inquiries and support questions
6. Escalate complex issues when needed

RESPONSE FORMAT:
Always respond with valid JSON containing:
{
  "message": "Your response to the customer",
  "recommendations": [
    {
      "productId": number,
      "type": "cross_sell" | "upsell" | "primary",
      "confidence": 0.0-1.0,
      "reason": "Why this product is recommended"
    }
  ],
  "intent": "product_inquiry" | "order_support" | "complaint" | "general",
  "urgency": "low" | "medium" | "high",
  "shouldEscalate": false
}`;
  }

  async processMessage(userMessage: string, context: ChatContext): Promise<AIResponse> {
    try {
      const systemPrompt = await this.generateSystemPrompt(context);
      
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...context.messages.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize response
      return {
        message: aiResponse.message || "I'm here to help! How can I assist you today?",
        recommendations: aiResponse.recommendations || [],
        intent: aiResponse.intent || "general",
        urgency: aiResponse.urgency || "low",
        shouldEscalate: aiResponse.shouldEscalate || false
      };

    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to process message with AI: " + (error as Error).message);
    }
  }

  async generateProductRecommendations(
    customerQuery: string, 
    products: Product[], 
    customerContext?: any
  ): Promise<InsertRecommendation[]> {
    try {
      const prompt = `Analyze this customer query and recommend the most relevant products:

CUSTOMER QUERY: "${customerQuery}"

CUSTOMER CONTEXT:
${JSON.stringify(customerContext || {}, null, 2)}

AVAILABLE PRODUCTS:
${products.map(p => 
  `ID: ${p.id}, Title: ${p.title}, Price: $${p.price}, Description: ${p.description || 'N/A'}`
).join('\n')}

Respond with JSON array of recommendations:
[
  {
    "productId": number,
    "type": "primary" | "cross_sell" | "upsell",
    "confidence": 0.0-1.0,
    "reason": "Explanation for recommendation"
  }
]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800,
      });

      const recommendations = JSON.parse(response.choices[0].message.content || '[]');
      
      return recommendations.filter((rec: any) => 
        rec.productId && rec.type && typeof rec.confidence === 'number'
      );

    } catch (error) {
      console.error("Failed to generate recommendations:", error);
      return [];
    }
  }

  async analyzeCustomerSentiment(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    urgency: 'low' | 'medium' | 'high';
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Analyze the sentiment and urgency of this customer message: "${message}"
          
          Respond with JSON: {
            "sentiment": "positive" | "neutral" | "negative",
            "confidence": 0.0-1.0,
            "urgency": "low" | "medium" | "high"
          }`
        }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 100,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      return { sentiment: 'neutral', confidence: 0.5, urgency: 'low' };
    }
  }
}

export const openaiService = new OpenAIService();
