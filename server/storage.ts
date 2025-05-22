import { 
  users, conversations, messages, products, orders, recommendations, webhooks, apiMetrics,
  type User, type InsertUser, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type Product, type InsertProduct,
  type Order, type InsertOrder, type Recommendation, type InsertRecommendation,
  type Webhook, type InsertWebhook
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversation management
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationBySessionId(sessionId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  getActiveConversations(): Promise<Conversation[]>;
  getConversationsByCustomer(customerId: string): Promise<Conversation[]>;

  // Message management
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(limit?: number): Promise<Message[]>;

  // Product management
  getProduct(id: number): Promise<Product | undefined>;
  getProductByShopifyId(shopifyId: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  searchProducts(query: string): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  syncProducts(products: InsertProduct[]): Promise<Product[]>;

  // Order management
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByShopifyId(shopifyId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByConversation(conversationId: number): Promise<Order[]>;
  getRecentOrders(limit?: number): Promise<Order[]>;

  // Recommendation management
  getRecommendation(id: number): Promise<Recommendation | undefined>;
  getRecommendationsByConversation(conversationId: number): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendation(id: number, updates: Partial<Recommendation>): Promise<Recommendation | undefined>;
  getTopRecommendedProducts(limit?: number): Promise<{ product: Product; recommendations: number; successRate: number }[]>;

  // Webhook management
  getWebhook(id: number): Promise<Webhook | undefined>;
  getAllWebhooks(): Promise<Webhook[]>;
  getActiveWebhooks(): Promise<Webhook[]>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: number, updates: Partial<Webhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;

  // Analytics and metrics
  getMetrics(): Promise<{
    activeConversations: number;
    totalConversations: number;
    conversionRate: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
  }>;
  recordApiMetric(service: string, endpoint?: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private recommendations: Map<number, Recommendation>;
  private webhooks: Map<number, Webhook>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.recommendations = new Map();
    this.webhooks = new Map();
    this.currentId = 1;
  }

  private nextId(): number {
    return this.currentId++;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextId();
    const user: User = { 
      ...insertUser, 
      id, 
      role: 'admin',
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(conv => conv.sessionId === sessionId);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.nextId();
    const conversation: Conversation = { 
      ...insertConversation, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async getActiveConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(conv => conv.status === 'active');
  }

  async getConversationsByCustomer(customerId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(conv => conv.customerId === customerId);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.nextId();
    const message: Message = { 
      ...insertMessage, 
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByShopifyId(shopifyId: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.shopifyId === shopifyId);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getActiveProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.nextId();
    const product: Product = { 
      ...insertProduct, 
      id,
      syncedAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { ...product, ...updates, syncedAt: new Date() };
    this.products.set(id, updated);
    return updated;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(product => 
      product.title.toLowerCase().includes(lowerQuery) ||
      (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
      (product.category && product.category.toLowerCase().includes(lowerQuery))
    );
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.category === category);
  }

  async syncProducts(insertProducts: InsertProduct[]): Promise<Product[]> {
    const products: Product[] = [];
    
    for (const insertProduct of insertProducts) {
      const existing = await this.getProductByShopifyId(insertProduct.shopifyId!);
      
      if (existing) {
        const updated = await this.updateProduct(existing.id, insertProduct);
        if (updated) products.push(updated);
      } else {
        const created = await this.createProduct(insertProduct);
        products.push(created);
      }
    }
    
    return products;
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByShopifyId(shopifyId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.shopifyId === shopifyId);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.nextId();
    const order: Order = { 
      ...insertOrder, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated = { ...order, ...updates, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.customerId === customerId);
  }

  async getOrdersByConversation(conversationId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.conversationId === conversationId);
  }

  async getRecentOrders(limit: number = 50): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Recommendation methods
  async getRecommendation(id: number): Promise<Recommendation | undefined> {
    return this.recommendations.get(id);
  }

  async getRecommendationsByConversation(conversationId: number): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(rec => rec.conversationId === conversationId);
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.nextId();
    const recommendation: Recommendation = { 
      ...insertRecommendation, 
      id,
      createdAt: new Date()
    };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  async updateRecommendation(id: number, updates: Partial<Recommendation>): Promise<Recommendation | undefined> {
    const recommendation = this.recommendations.get(id);
    if (!recommendation) return undefined;
    
    const updated = { ...recommendation, ...updates };
    this.recommendations.set(id, updated);
    return updated;
  }

  async getTopRecommendedProducts(limit: number = 10): Promise<{ product: Product; recommendations: number; successRate: number }[]> {
    const productStats = new Map<number, { recommendations: number; accepted: number }>();
    
    for (const rec of this.recommendations.values()) {
      const stats = productStats.get(rec.productId) || { recommendations: 0, accepted: 0 };
      stats.recommendations++;
      if (rec.accepted) stats.accepted++;
      productStats.set(rec.productId, stats);
    }
    
    const results: { product: Product; recommendations: number; successRate: number }[] = [];
    
    for (const [productId, stats] of productStats.entries()) {
      const product = this.products.get(productId);
      if (product) {
        results.push({
          product,
          recommendations: stats.recommendations,
          successRate: stats.recommendations > 0 ? stats.accepted / stats.recommendations : 0
        });
      }
    }
    
    return results
      .sort((a, b) => b.recommendations - a.recommendations)
      .slice(0, limit);
  }

  // Webhook methods
  async getWebhook(id: number): Promise<Webhook | undefined> {
    return this.webhooks.get(id);
  }

  async getAllWebhooks(): Promise<Webhook[]> {
    return Array.from(this.webhooks.values());
  }

  async getActiveWebhooks(): Promise<Webhook[]> {
    return Array.from(this.webhooks.values()).filter(webhook => webhook.isActive);
  }

  async createWebhook(insertWebhook: InsertWebhook): Promise<Webhook> {
    const id = this.nextId();
    const webhook: Webhook = { 
      ...insertWebhook, 
      id,
      createdAt: new Date()
    };
    this.webhooks.set(id, webhook);
    return webhook;
  }

  async updateWebhook(id: number, updates: Partial<Webhook>): Promise<Webhook | undefined> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return undefined;
    
    const updated = { ...webhook, ...updates };
    this.webhooks.set(id, updated);
    return updated;
  }

  async deleteWebhook(id: number): Promise<boolean> {
    return this.webhooks.delete(id);
  }

  // Analytics
  async getMetrics(): Promise<{
    activeConversations: number;
    totalConversations: number;
    conversionRate: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
  }> {
    const activeConversations = Array.from(this.conversations.values()).filter(conv => conv.status === 'active').length;
    const totalConversations = this.conversations.size;
    const orders = Array.from(this.orders.values());
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const conversationsWithOrders = new Set(orders.map(order => order.conversationId)).size;
    const conversionRate = totalConversations > 0 ? conversationsWithOrders / totalConversations : 0;

    return {
      activeConversations,
      totalConversations,
      conversionRate,
      totalRevenue,
      averageOrderValue,
      totalOrders,
    };
  }

  async recordApiMetric(service: string, endpoint?: string): Promise<void> {
    // In memory implementation - in production this would aggregate metrics
    console.log(`API metric recorded: ${service}${endpoint ? ` - ${endpoint}` : ''}`);
  }
}

export const storage = new MemStorage();
