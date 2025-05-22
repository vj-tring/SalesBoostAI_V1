import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MetricsCards from "@/components/MetricsCards";
import ChatInterface from "@/components/ChatInterface";
import SystemStatus from "@/components/SystemStatus";
import ConversationList from "@/components/ConversationList";
import IntegrationPanel from "@/components/IntegrationPanel";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Real-time connection
  useWebSocket();

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 10000, // Update every 10 seconds
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders?limit=10");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-line" },
    { id: "conversations", label: "Conversations", icon: "fas fa-comments" },
    { id: "integrations", label: "Integrations", icon: "fas fa-plug" },
    { id: "analytics", label: "Analytics", icon: "fas fa-chart-bar" },
    { id: "webhooks", label: "Webhooks", icon: "fas fa-webhook" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">SalesBot AI</h1>
                  <p className="text-sm text-neutral-600">Production Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-800 font-medium">Live</span>
              </div>
              <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <i className="fas fa-cog"></i>
              </button>
              <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <i className="fas fa-user-circle text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <MetricsCards metrics={metrics} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ChatInterface />
              </div>
              <div className="space-y-6">
                <SystemStatus />
                <ConversationList conversations={conversations} />
              </div>
            </div>
            
            <IntegrationPanel orders={orders} />
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab === "conversations" && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">All Conversations</h3>
            <ConversationList conversations={conversations} expanded={true} />
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">API Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <i className="fas fa-brain text-blue-600 text-xl"></i>
                    <div>
                      <h4 className="font-medium text-neutral-900">OpenAI GPT-4</h4>
                      <p className="text-sm text-neutral-600">Conversational AI</p>
                    </div>
                  </div>
                  <div className="text-sm text-green-600">Connected & Active</div>
                </div>
                
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <i className="fab fa-shopify text-green-600 text-xl"></i>
                    <div>
                      <h4 className="font-medium text-neutral-900">Shopify</h4>
                      <p className="text-sm text-neutral-600">E-commerce Platform</p>
                    </div>
                  </div>
                  <div className="text-sm text-green-600">Connected & Syncing</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Analytics Dashboard</h3>
            <div className="h-64 bg-neutral-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <i className="fas fa-chart-line text-4xl text-neutral-400 mb-3"></i>
                <p className="text-neutral-600">Analytics charts will be displayed here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Webhook Management</h3>
              <button className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                <i className="fas fa-plus mr-2"></i>Add Webhook
              </button>
            </div>
            <div className="text-center py-12">
              <i className="fas fa-webhook text-4xl text-neutral-400 mb-3"></i>
              <p className="text-neutral-600">No webhooks configured yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
