import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, Calendar, Briefcase, Users, UserPlus, Cloud } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Chat() {
  const [input, setInput] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: conversations } = trpc.ai.listConversations.useQuery();
  const { data: messages } = trpc.ai.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const createConversationMutation = trpc.ai.createConversation.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      utils.ai.listConversations.invalidate();
    },
  });

  const sendMessageMutation = trpc.ai.sendMessage.useMutation({
    onSuccess: () => {
      utils.ai.getMessages.invalidate();
      utils.ai.listConversations.invalidate();
      setInput("");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewConversation = () => {
    createConversationMutation.mutate({
      title: "New Conversation",
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;

    if (!selectedConversationId) {
      // Create new conversation first
      createConversationMutation.mutate(
        { title: input.slice(0, 50) },
        {
          onSuccess: (data) => {
            sendMessageMutation.mutate({
              conversationId: data.id,
              content: input,
            });
          },
        }
      );
    } else {
      sendMessageMutation.mutate({
        conversationId: selectedConversationId,
        content: input,
      });
    }
  };

  const quickActions = [
    { label: "Today's Jobs", icon: Calendar, action: () => setInput("Show me today's jobs") },
    { label: "Create Job", icon: Briefcase, action: () => setInput("Help me create a new spray job") },
    { label: "View Customers", icon: Users, action: () => setInput("Show me all my customers") },
    { label: "Add Customer", icon: UserPlus, action: () => setInput("I want to add a new customer") },
    { label: "Weather Check", icon: Cloud, action: () => setInput("What's the weather forecast for spraying?") },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Conversations Sidebar */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={handleNewConversation}
            className="w-full"
            disabled={createConversationMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
              Conversations
            </div>
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedConversationId === conv.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="font-medium truncate">{conv.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
            {(!conversations || conversations.length === 0) && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No conversations yet.
                <br />
                Start a new one!
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                R
              </div>
              <div>
                <h2 className="font-semibold">Ready2Spray AI Assistant</h2>
                <p className="text-sm text-muted-foreground">
                  I can help you with job scheduling, weather conditions, EPA compliance, and agricultural operations
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
            {!selectedConversationId && !messages ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    Hello! I'm your Ready2Spray AI assistant
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    I can help you with job scheduling, weather conditions, EPA compliance, and agricultural operations. What would you like assistance with today?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Streamdown>{message.content}</Streamdown>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Quick Actions Bar */}
          {selectedConversationId && (
            <div className="px-4 py-2 border-t bg-muted/30 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    className="whitespace-nowrap"
                  >
                    <action.icon className="mr-1 h-3 w-3" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me to lookup, add, or edit jobs, customers, personnel, or other information..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
