import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X, Send, Loader2, Minus, Maximize2, Calendar, Briefcase, Cloud, Zap, History, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CHAT_STATE_KEY = "chat-widget-state";
const LAST_READ_KEY = "chat-last-read";

interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  lastReadTimestamp: number;
}

export function FloatingChatWidget() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: conversations } = trpc.ai.listConversations.useQuery(undefined, {
    enabled: isOpen,
  });
  
  const { data: messages } = trpc.ai.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId && isOpen }
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

  const deleteConversationMutation = trpc.ai.deleteConversation.useMutation({
    onSuccess: () => {
      utils.ai.listConversations.invalidate();
      setSelectedConversationId(null);
      setShowHistory(false);
      toast.success("Conversation deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete conversation: ${error.message}`);
    },
  });

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(CHAT_STATE_KEY);
      if (savedState) {
        const state: ChatState = JSON.parse(savedState);
        setIsOpen(state.isOpen);
        setIsMinimized(state.isMinimized);
        setLastReadTimestamp(state.lastReadTimestamp || Date.now());
      }
    } catch (error) {
      console.error("Failed to load chat state:", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const state: ChatState = {
        isOpen,
        isMinimized,
        lastReadTimestamp,
      };
      localStorage.setItem(CHAT_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save chat state:", error);
    }
  }, [isOpen, isMinimized, lastReadTimestamp]);

  // Calculate unread messages
  useEffect(() => {
    if (messages && !isOpen) {
      const newMessages = messages.filter(
        (msg) => msg.role === "assistant" && new Date(msg.createdAt).getTime() > lastReadTimestamp
      );
      setUnreadCount(newMessages.length);
    } else if (isOpen) {
      // Mark as read when chat is opened
      setUnreadCount(0);
      setLastReadTimestamp(Date.now());
    }
  }, [messages, isOpen]); // Removed lastReadTimestamp from dependencies to prevent infinite loop

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-select first conversation or create new one when opening
  useEffect(() => {
    if (isOpen && conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [isOpen, conversations, selectedConversationId]);

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

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setLastReadTimestamp(Date.now());
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show the widget on the full chat page
  if (location === "/chat") {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs
font-semibold"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Modal - Minimized State */}
      {isOpen && isMinimized && (
        <div className="w-80 bg-card border rounded-lg shadow-lg" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <div className="font-semibold text-sm">Ready2Spray AI</div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMinimize}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal - Full State */}
      {isOpen && !isMinimized && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent className="max-w-md h-[600px] p-0 flex flex-col overflow-hidden top-auto left-auto translate-x-0 translate-y-0 m-0 data-[state=open]:slide-in-from-bottom-2 data-[state=open]:slide-in-from-right-2" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                    R
                  </div>
                  <div>
                    <div className="font-semibold">Ready2Spray AI Assistant</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Ask me anything about your operations
                    </div>
                  </div>
                </DialogTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowHistory(!showHistory)}
                    title="Conversation History"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleMinimize}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Conversation History Sidebar */}
            {showHistory && (
              <div className="border-b p-4 max-h-48 overflow-y-auto shrink-0">
                <h3 className="text-sm font-semibold mb-2">Past Conversations</h3>
                {conversations && conversations.length > 0 ? (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer ${
                          selectedConversationId === conv.id ? "bg-accent" : ""
                        }`}
                      >
                        <div
                          className="flex-1 text-sm truncate"
                          onClick={() => {
                            setSelectedConversationId(conv.id);
                            setShowHistory(false);
                          }}
                        >
                          {conv.title || `Conversation ${conv.id}`}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this conversation?")) {
                              deleteConversationMutation.mutate({ conversationId: conv.id });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No past conversations</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedConversationId(null);
                    setShowHistory(false);
                  }}
                >
                  Start New Conversation
                </Button>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0 px-6" ref={scrollRef}>
              {!selectedConversationId || !messages || messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">
                      Hello! I'm your AI assistant
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      I can help you with job scheduling, weather conditions, EPA compliance, and agricultural operations. What would you like assistance with today?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("Show me today's schedule")}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Today's Schedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("What's the weather forecast for spraying?")}
                      className="flex items-center gap-2"
                    >
                      <Cloud className="h-4 w-4" />
                      Weather Check
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("Help me create a new spray job")}
                      className="flex items-center gap-2"
                    >
                      <Briefcase className="h-4 w-4" />
                      Create New Job
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInput("Show me quick stats")}
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Quick Stats
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
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

            {/* Input */}
            <div className="px-6 py-4 border-t shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything..."
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
                  size="icon"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
