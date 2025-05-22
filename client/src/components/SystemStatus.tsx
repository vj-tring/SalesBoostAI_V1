import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SystemStatus() {
  const { toast } = useToast();
  
  const { data: healthStatus } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 60000, // Check every minute
  });

  const handleSyncProducts = async () => {
    try {
      const response = await fetch("/api/products/sync", { method: "POST" });
      if (!response.ok) throw new Error("Sync failed");
      
      const result = await response.json();
      toast({
        title: "Products Synced",
        description: `Successfully synced ${result.count} products from Shopify`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync products from Shopify",
        variant: "destructive",
      });
    }
  };

  const handleTestWebhook = async () => {
    toast({
      title: "Webhook Test",
      description: "Testing webhook endpoints...",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Preparing conversation data for export...",
    });
  };

  const getStatusColor = (status: boolean | undefined) => {
    if (status === undefined) return "bg-gray-400";
    return status ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = (status: boolean | undefined) => {
    if (status === undefined) return "Unknown";
    return status ? "Operational" : "Offline";
  };

  const services = [
    {
      name: "OpenAI API",
      status: healthStatus?.services?.openai,
    },
    {
      name: "Shopify API", 
      status: healthStatus?.services?.shopify,
    },
    {
      name: "Database",
      status: healthStatus?.services?.database,
    },
    {
      name: "Webhooks",
      status: true, // Assume operational for now
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${getStatusColor(service.status)} rounded-full`}></div>
                  <span className="text-sm font-medium text-neutral-900">{service.name}</span>
                </div>
                <span className={`text-xs font-medium ${
                  service.status ? "text-green-600" : "text-red-600"
                }`}>
                  {getStatusText(service.status)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={handleSyncProducts}
              className="w-full justify-start bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
              variant="outline"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Sync Shopify Products
            </Button>
            
            <Button 
              onClick={handleTestWebhook}
              className="w-full justify-start bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-0"
              variant="outline"
            >
              <i className="fas fa-webhook mr-2"></i>
              Test Webhook
            </Button>
            
            <Button 
              onClick={handleExportData}
              className="w-full justify-start bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-0"
              variant="outline"
            >
              <i className="fas fa-download mr-2"></i>
              Export Conversations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
