import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Order {
  id: number;
  shopifyId?: string;
  customerId?: string;
  customerEmail?: string;
  status: string;
  totalAmount: string;
  currency: string;
  source?: string;
  createdAt: string;
}

interface IntegrationPanelProps {
  orders?: Order[];
}

export default function IntegrationPanel({ orders = [] }: IntegrationPanelProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "ai_chatbot":
        return "bg-blue-100 text-blue-800";
      case "cross_sell":
        return "bg-orange-100 text-orange-800";
      case "upsell":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  const recentOrders = orders.slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* API Integrations Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">API Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fab fa-shopify text-green-600 text-xl"></i>
                <div>
                  <p className="font-medium text-neutral-900">Shopify</p>
                  <p className="text-sm text-neutral-600">E-commerce Platform</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-brain text-blue-600 text-xl"></i>
                <div>
                  <p className="font-medium text-neutral-900">OpenAI GPT-4</p>
                  <p className="text-sm text-neutral-600">Conversational AI</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <i className="fas fa-webhook text-gray-600 text-xl"></i>
                <div>
                  <p className="font-medium text-neutral-900">Webhook API</p>
                  <p className="text-sm text-neutral-600">Third-party Integration</p>
                </div>
              </div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>

          <Button className="w-full mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0" variant="outline">
            Manage Integrations
          </Button>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-neutral-900">Recent Orders</CardTitle>
            <Button className="text-sm text-blue-600 hover:text-blue-700" variant="ghost">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-shopping-cart text-4xl text-neutral-300 mb-3"></i>
              <p className="text-neutral-600">No orders yet</p>
              <p className="text-sm text-neutral-500">Orders will appear here when customers make purchases</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-neutral-900">
                        #{order.shopifyId || order.id}
                      </span>
                      {order.source && (
                        <Badge className={getSourceColor(order.source)} variant="secondary">
                          {order.source.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">
                      {order.customerEmail || `Customer ${order.customerId || 'Unknown'}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-neutral-900">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </p>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Endpoint Documentation */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">API Integration Guide</CardTitle>
          <p className="text-neutral-600">Quick setup for webhook integration with third-party systems</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-neutral-900 mb-3">Webhook Endpoint</h4>
              <div className="bg-neutral-900 rounded-lg p-4 mb-4">
                <code className="text-green-400 font-mono text-sm">
                  POST /api/webhook/chat
                </code>
              </div>
              
              <h4 className="text-md font-semibold text-neutral-900 mb-3">Authentication</h4>
              <div className="bg-neutral-900 rounded-lg p-4 mb-4">
                <code className="text-neutral-300 font-mono text-sm">
                  X-Webhook-Signature: your_signature<br/>
                  X-Webhook-Secret: your_secret<br/>
                  Content-Type: application/json
                </code>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-neutral-900 mb-3">Sample Payload</h4>
              <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-neutral-300 font-mono text-sm">
{`{
  "customer_id": "cust_123456",
  "message": "I'm looking for headphones",
  "context": {
    "order_history": ["order_789"],
    "preferences": ["electronics"]
  },
  "session_id": "sess_abc123"
}`}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center space-x-4">
            <Button className="bg-blue-500 text-white hover:bg-blue-600">
              View Full Documentation
            </Button>
            <Button className="border border-neutral-300 text-neutral-700 hover:bg-neutral-50" variant="outline">
              Generate API Key
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
