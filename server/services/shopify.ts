import axios, { AxiosInstance } from 'axios';
import type { Product, Order, InsertProduct, InsertOrder } from '@shared/schema';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  tags: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price?: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status?: string;
  line_items: Array<{
    id: number;
    product_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export class ShopifyService {
  private client: AxiosInstance;
  private shopUrl: string;

  constructor() {
    this.shopUrl = process.env.SHOPIFY_SHOP_URL || process.env.SHOPIFY_URL || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_TOKEN || '';

    if (!this.shopUrl || !accessToken) {
      throw new Error('Shopify configuration missing: SHOPIFY_SHOP_URL and SHOPIFY_ACCESS_TOKEN required');
    }

    this.client = axios.create({
      baseURL: `https://${this.shopUrl}/admin/api/2024-01`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async syncProducts(): Promise<Product[]> {
    try {
      const response = await this.client.get('/products.json?limit=250');
      const shopifyProducts: ShopifyProduct[] = response.data.products;

      const products: InsertProduct[] = shopifyProducts.map(product => {
        const mainVariant = product.variants[0];
        const mainImage = product.images[0];

        return {
          shopifyId: product.id.toString(),
          title: product.title,
          description: this.stripHtml(product.body_html),
          price: mainVariant?.price || '0',
          compareAtPrice: mainVariant?.compare_at_price || null,
          category: product.product_type || 'General',
          tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
          inventory: mainVariant?.inventory_quantity || 0,
          imageUrl: mainImage?.src || null,
          isActive: product.status === 'active',
        };
      });

      console.log(`Synced ${products.length} products from Shopify`);
      return products as Product[];

    } catch (error) {
      console.error('Shopify product sync failed:', error);
      throw new Error('Failed to sync products from Shopify: ' + (error as Error).message);
    }
  }

  async getProduct(productId: string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.client.get(`/products/${productId}.json`);
      return response.data.product;
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      return null;
    }
  }

  async getOrder(orderId: string): Promise<ShopifyOrder | null> {
    try {
      const response = await this.client.get(`/orders/${orderId}.json`);
      return response.data.order;
    } catch (error) {
      console.error(`Failed to get order ${orderId}:`, error);
      return null;
    }
  }

  async getCustomerOrders(customerId: string): Promise<ShopifyOrder[]> {
    try {
      const response = await this.client.get(`/customers/${customerId}/orders.json`);
      return response.data.orders;
    } catch (error) {
      console.error(`Failed to get customer orders for ${customerId}:`, error);
      return [];
    }
  }

  async createOrder(orderData: {
    customer: { email: string; first_name?: string; last_name?: string };
    line_items: Array<{ product_id: number; quantity: number }>;
    financial_status?: string;
  }): Promise<ShopifyOrder | null> {
    try {
      const response = await this.client.post('/orders.json', {
        order: orderData
      });
      return response.data.order;
    } catch (error) {
      console.error('Failed to create Shopify order:', error);
      throw new Error('Failed to create order in Shopify: ' + (error as Error).message);
    }
  }

  async getInventoryLevel(productId: string, variantId?: string): Promise<number> {
    try {
      const endpoint = variantId 
        ? `/variants/${variantId}.json`
        : `/products/${productId}.json`;
      
      const response = await this.client.get(endpoint);
      
      if (variantId) {
        return response.data.variant.inventory_quantity || 0;
      } else {
        return response.data.product.variants[0]?.inventory_quantity || 0;
      }
    } catch (error) {
      console.error('Failed to get inventory level:', error);
      return 0;
    }
  }

  async searchProducts(query: string, limit: number = 20): Promise<ShopifyProduct[]> {
    try {
      const response = await this.client.get(`/products.json?title=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data.products;
    } catch (error) {
      console.error('Product search failed:', error);
      return [];
    }
  }

  async getRecentOrders(limit: number = 50): Promise<ShopifyOrder[]> {
    try {
      const response = await this.client.get(`/orders.json?limit=${limit}&status=any`);
      return response.data.orders;
    } catch (error) {
      console.error('Failed to get recent orders:', error);
      return [];
    }
  }

  async getOrdersByStatus(status: string): Promise<ShopifyOrder[]> {
    try {
      const response = await this.client.get(`/orders.json?financial_status=${status}`);
      return response.data.orders;
    } catch (error) {
      console.error(`Failed to get orders with status ${status}:`, error);
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.client.put(`/orders/${orderId}.json`, {
        order: { id: orderId, financial_status: status }
      });
      return true;
    } catch (error) {
      console.error(`Failed to update order ${orderId} status:`, error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/shop.json');
      return true;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }
}

export const shopifyService = new ShopifyService();
