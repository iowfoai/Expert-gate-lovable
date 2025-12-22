import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User, Loader2, MessageSquare, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface InterviewRequest {
  id: string;
  research_topic: string;
  description: string;
  status: string;
  preferred_date: string | null;
  scheduled_date: string | null;
  duration_minutes: number;
  created_at: string;
  expert_id: string;
  researcher_id: string;
  expert?: {
    full_name: string;
    institution: string | null;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  connection_id: string;
}

const Interviews = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<InterviewRequest[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
    await fetchRequests(session.user.id);
  };

  const fetchRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("interview_requests")
        .select("*")
        .eq("researcher_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch expert info for each request
      if (data && data.length > 0) {
        const expertIds = [...new Set(data.map(r => r.expert_id))];
        const { data: experts } = await supabase
          .from("profiles")
          .select("id, full_name, institution")
          .in("id", expertIds);

        const requestsWithExperts = data.map(req => ({
          ...req,
          expert: experts?.find(e => e.id === req.expert_id)
        }));

        setRequests(requestsWithExperts);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (interview: InterviewRequest) => {
    setSelectedInterview(interview);
    
    // Find or create connection for this interview
    const { data: existingConnection } = await supabase
      .from("expert_connections")
      .select("id")
      .or(`and(requester_id.eq.${userId},recipient_id.eq.${interview.expert_id}),and(requester_id.eq.${interview.expert_id},recipient_id.eq.${userId})`)
      .eq("status", "accepted")
      .maybeSingle();

    if (existingConnection) {
      setConnectionId(existingConnection.id);
      await fetchMessages(existingConnection.id);
      subscribeToMessages(existingConnection.id);
    } else {
      // Create a connection for this interview
      const { data: newConnection, error } = await supabase
        .from("expert_connections")
        .insert({
          requester_id: userId,
          recipient_id: interview.expert_id,
          status: "accepted",
          connection_type: "interview"
        })
        .select()
        .single();

      if (!error && newConnection) {
        setConnectionId(newConnection.id);
        subscribeToMessages(newConnection.id);
      }
    }
  };

  const fetchMessages = async (connId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("connection_id", connId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = (connId: string) => {
    const channel = supabase
      .channel(`messages-${connId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${connId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !connectionId || !userId) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          connection_id: connectionId,
          sender_id: userId,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      declined: "destructive",
      completed: "outline",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      accepted: "Accepted",
      declined: "Declined",
      completed: "Completed",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const filterRequests = (status?: string) => {
    if (!status) return requests;
    return requests.filter((req) => req.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Chat View
  if (selectedInterview) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => {
                setSelectedInterview(null);
                setMessages([]);
                setConnectionId(null);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Interviews
            </Button>

            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">
                  Chat with {selectedInterview.expert?.full_name}
                </CardTitle>
                <CardDescription>
                  Re: {selectedInterview.research_topic}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No messages yet. Start the conversation!
                      </p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.sender_id === userId
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMessage}
                    />
                    <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Interviews</h1>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterRequests("pending").length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({filterRequests("accepted").length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterRequests("completed").length})</TabsTrigger>
            </TabsList>

            {["all", "pending", "accepted", "completed"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filterRequests(tab === "all" ? undefined : tab).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No interviews found</p>
                      {tab === "all" && (
                        <Button 
                          className="mt-4" 
                          onClick={() => navigate("/find-experts")}
                        >
                          Interview Experts
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filterRequests(tab === "all" ? undefined : tab).map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{request.research_topic}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <User className="w-4 h-4" />
                              Expert: {request.expert?.full_name || "Unknown"}
                              {request.expert?.institution && (
                                <span className="text-muted-foreground">
                                  • {request.expert.institution}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm line-clamp-2">{request.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {request.scheduled_date
                              ? format(new Date(request.scheduled_date), "PPP")
                              : request.preferred_date
                              ? format(new Date(request.preferred_date), "PPP") + " (preferred)"
                              : "No date set"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {request.duration_minutes} minutes
                          </div>
                        </div>
                        {request.status === "accepted" && (
                          <Button 
                            className="mt-2"
                            onClick={() => handleOpenChat(request)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat with Expert
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Interviews;
