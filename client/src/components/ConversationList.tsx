import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: number;
  sessionId: string;
  customerId?: string;
  customerName?: string;
  status: string;
  lastMessage?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations?: Conversation[];
  expanded?: boolean;
}

export default function ConversationList({ conversations = [], expanded = false }: ConversationListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const displayConversations = expanded ? conversations : conversations.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-neutral-900">
            {expanded ? "All Conversations" : "Recent Conversations"}
          </CardTitle>
          {!expanded && conversations.length > 5 && (
            <Badge variant="secondary">
              +{conversations.length - 5} more
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayConversations.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-comments text-4xl text-neutral-300 mb-3"></i>
            <p className="text-neutral-600">No conversations yet</p>
            <p className="text-sm text-neutral-500">Start a conversation to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-neutral-900">
                        {conversation.customerName || `Guest ${conversation.sessionId.slice(-6)}`}
                      </span>
                      <Badge className={getStatusColor(conversation.status)} variant="secondary">
                        {conversation.status}
                      </Badge>
                    </div>
                    
                    {conversation.lastMessage && (
                      <p className="text-sm text-neutral-600 truncate mb-2">
                        {conversation.lastMessage}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{getTimeAgo(conversation.updatedAt)}</span>
                      {conversation.messageCount && (
                        <span>{conversation.messageCount} messages</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
