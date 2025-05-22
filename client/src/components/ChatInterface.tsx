import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  recommendations?: Array<{
    productId: number;
    type: string;
    confidence: number;
    reason: string;
  }>;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI sales assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; sessionId: string }) => {
      const response = await apiRequest("POST", "/api/conversations/message", data);
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        recommendations: data.recommendations,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Invalidate conversations to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      if (data.recommendations && data.recommendations.length > 0) {
        toast({
          title: "Product Recommendations",
          description: `AI found ${data.recommendations.length} relevant products for you`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to send message:", error);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    sendMessageMutation.mutate({
      message: inputMessage,
      sessionId,
    });

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Live Chat Interface</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-neutral-600">Real-time</span>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start space-x-3 max-w-md ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user" 
                  ? "bg-neutral-300" 
                  : "bg-primary-500"
              }`}>
                <i className={`fas ${message.role === "user" ? "fa-user text-neutral-600" : "fa-robot text-white"} text-sm`}></i>
              </div>
              <div className="flex-1">
                <div className={`rounded-lg p-3 ${
                  message.role === "user" 
                    ? "bg-neutral-100" 
                    : "bg-primary-50"
                }`}>
                  <p className="text-sm text-neutral-800">{message.content}</p>
                </div>
                
                {/* Show recommendations if available */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-neutral-600">Recommended products:</p>
                    {message.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">Product #{rec.productId}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {(rec.confidence * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-neutral-500 mt-1">
                  {message.role === "user" ? "You" : "AI Agent"} • {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </div>
    </Card>
  );
}
