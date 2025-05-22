import { apiRequest } from './queryClient';

export interface ConversationMessage {
  message: string;
  sessionId: string;
  customerId?: string;
  customerName?: string;
}

export interface AIResponse {
  message: string;
  recommendations?: Array<{
    productId: number;
    type: string;
    confidence: number;
    reason: string;
  }>;
  intent?: string;
  urgency?: string;
  messageId: number;
}

export interface Product {
  id: number;
  shopifyId?: string;
  title: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  category?: string;
  tags?: string[];
  inventory?: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Order {
  id: number;
  shopifyId?: string;
  conversationId?: number;
  customerId?: string;
  customerEmail?: string;
  status: string;
  totalAmount: string;
  currency: string;
  lineItems?: any;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  description?: string;
  lastTriggered?: string;
  createdAt: string;
}

export interface Metrics {
  activeConversations: number;
  totalConversations: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
}

// API functions
export const api = {
  // Health check
  async getHealth() {
    const response = await apiRequest('GET', '/api/health');
    return response.json();
  },

  // Metrics
  async getMetrics(): Promise<Metrics> {
    const response = await apiRequest('GET', '/api/metrics');
    return response.json();
  },

  // Conversations
  async getConversations() {
    const response = await apiRequest('GET', '/api/conversations');
    return response.json();
  },

  async getConversation(id: number) {
    const response = await apiRequest('GET', `/api/conversations/${id}`);
    return response.json();
  },

  async sendMessage(data: ConversationMessage): Promise<AIResponse> {
    const response = await apiRequest('POST', '/api/conversations/message', data);
    return response.json();
  },

  // Products
  async getProducts(params?: { search?: string; category?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const url = `/api/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    return response.json();
  },

  async syncProducts() {
    const response = await apiRequest('POST', '/api/products/sync');
    return response.json();
  },

  // Orders
  async getOrders(params?: { customer?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.customer) searchParams.set('customer', params.customer);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    
    const url = `/api/orders${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await apiRequest('GET', url);
    return response.json();
  },

  async createOrder(orderData: any) {
    const response = await apiRequest('POST', '/api/orders', orderData);
    return response.json();
  },

  // Webhooks
  async getWebhooks(): Promise<Webhook[]> {
    const response = await apiRequest('GET', '/api/webhooks');
    return response.json();
  },

  async createWebhook(data: { url: string; events: string[]; description?: string }) {
    const response = await apiRequest('POST', '/api/webhooks', data);
    return response.json();
  },

  async testWebhook(id: number) {
    const response = await apiRequest('POST', `/api/webhooks/${id}/test`);
    return response.json();
  },

  // Analytics
  async getRecommendationsAnalytics() {
    const response = await apiRequest('GET', '/api/analytics/recommendations');
    return response.json();
  },

  // Webhook integration endpoint for third-party systems
  async processWebhookMessage(data: {
    customer_id?: string;
    message: string;
    context?: any;
    session_id: string;
  }) {
    const response = await apiRequest('POST', '/api/webhook/chat', data);
    return response.json();
  },
};

export default api;
