import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  status: text("status").notNull().default("active"), // active, completed, escalated
  lastMessage: text("last_message"),
  context: jsonb("context"), // customer history, preferences, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // AI confidence, recommendations, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  shopifyId: text("shopify_id").unique(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  category: text("category"),
  tags: jsonb("tags"), // array of tags
  inventory: integer("inventory").default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  shopifyId: text("shopify_id").unique(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  customerId: text("customer_id"),
  customerEmail: text("customer_email"),
  status: text("status").notNull(), // pending, processing, shipped, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  lineItems: jsonb("line_items"), // product details
  source: text("source").default("ai_chatbot"), // ai_chatbot, cross_sell, upsell
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // cross_sell, upsell, primary
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00 to 1.00
  reason: text("reason"), // AI reasoning for recommendation
  presented: boolean("presented").default(false),
  accepted: boolean("accepted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  events: jsonb("events").notNull(), // array of event types
  secret: text("secret").notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiMetrics = pgTable("api_metrics", {
  id: serial("id").primaryKey(),
  service: text("service").notNull(), // openai, shopify, webhook
  endpoint: text("endpoint"),
  requestCount: integer("request_count").default(0),
  errorCount: integer("error_count").default(0),
  avgResponseTime: integer("avg_response_time"), // milliseconds
  date: timestamp("date").defaultNow().notNull(),
});

// Insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  syncedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  lastTriggered: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
