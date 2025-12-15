import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { MessageSquare, UserCheck, Send, X, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface SupportMessage {
  id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
}

interface PendingExpert {
  id: string;
  full_name: string;
  email: string;
  institution: string;
  field_of_expertise: string[];
  years_of_experience: number;
  education_level: string;
  bio: string;
  specific_experience: string;
  verification_status: string;
  created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const [user, setUser] = useState<User | null>(null);
  
  // Support tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // Expert verification state
  const [pendingExperts, setPendingExperts] = useState<PendingExpert[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<PendingExpert | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTickets();
      fetchPendingExperts();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`admin-ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data as any);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const fetchPendingExperts = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "expert")
      .in("verification_status", ["pending", "rejected"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPendingExperts(data as PendingExpert[]);
    }
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          content: newMessage,
          is_admin: true
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: user?.id })
        .eq("id", selectedTicket.id);

      if (error) throw error;
      
      toast({
        title: "Ticket Closed",
        description: "The support ticket has been closed.",
      });

      setSelectedTicket({ ...selectedTicket, status: "closed" });
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyExpert = async (expertId: string, approved: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          verification_status: approved ? "verified" : "rejected",
          verification_notes: approved ? "Approved by admin" : "Rejected by admin"
        })
        .eq("id", expertId);

      if (error) throw error;

      // Send notification to expert
      await supabase.functions.invoke("send-expert-verification-notification", {
        body: { expertId, approved }
      });

      toast({
        title: approved ? "Expert Verified" : "Expert Rejected",
        description: approved 
          ? "The expert has been verified and can now receive interview requests."
          : "The expert has been rejected.",
      });

      setSelectedExpert(null);
      fetchPendingExperts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <Badge variant="destructive" className="mb-8">Admin</Badge>

          <Tabs defaultValue="support" className="space-y-6">
            <TabsList>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Customer Support Tickets
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Expert Verifications
                {pendingExperts.filter(e => e.verification_status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingExperts.filter(e => e.verification_status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="support">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Tickets List */}
                <div className="md:col-span-1">
                  <h2 className="font-semibold mb-4">All Tickets</h2>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedTicket?.id === ticket.id ? "border-primary" : ""
                        }`}
                        onClick={() => handleSelectTicket(ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {ticket.profiles?.full_name || "Unknown"}
                              </p>
                            </div>
                            <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {tickets.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No support tickets
                      </p>
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="md:col-span-2">
                  <Card className="h-[500px] flex flex-col">
                    {selectedTicket ? (
                      <>
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                              <CardDescription>
                                From: {selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.email})
                              </CardDescription>
                            </div>
                            {selectedTicket.status === "open" && (
                              <Button variant="destructive" size="sm" onClick={handleCloseTicket}>
                                <X className="w-4 h-4 mr-1" />
                                Close Ticket
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.is_admin
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-xs font-semibold mb-1">
                                  {msg.is_admin ? "Admin" : selectedTicket.profiles?.full_name}
                                </p>
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                        {selectedTicket.status === "open" && (
                          <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                              <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1"
                              />
                              <Button type="submit" disabled={loading}>
                                <Send className="w-4 h-4" />
                              </Button>
                            </form>
                          </div>
                        )}
                      </>
                    ) : (
                      <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Select a ticket to view</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="verification">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pending Experts List */}
                <div>
                  <h2 className="font-semibold mb-4">Pending Expert Verifications</h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {pendingExperts.map((expert) => (
                      <Card
                        key={expert.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedExpert?.id === expert.id ? "border-primary" : ""
                        }`}
                        onClick={() => setSelectedExpert(expert)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{expert.full_name}</p>
                              <p className="text-sm text-muted-foreground">{expert.email}</p>
                              <p className="text-sm text-muted-foreground">{expert.institution}</p>
                            </div>
                            <Badge variant={expert.verification_status === "pending" ? "default" : "destructive"}>
                              {expert.verification_status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingExperts.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No pending verifications
                      </p>
                    )}
                  </div>
                </div>

                {/* Expert Details */}
                <div>
                  {selectedExpert ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedExpert.full_name}</CardTitle>
                        <CardDescription>{selectedExpert.email}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Education Level</p>
                          <p className="text-muted-foreground">{selectedExpert.education_level || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Institution</p>
                          <p className="text-muted-foreground">{selectedExpert.institution || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Field of Expertise</p>
                          <p className="text-muted-foreground">
                            {selectedExpert.field_of_expertise?.join(", ") || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Years of Experience</p>
                          <p className="text-muted-foreground">{selectedExpert.years_of_experience || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Specific Experience</p>
                          <p className="text-muted-foreground">{selectedExpert.specific_experience || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Bio</p>
                          <p className="text-muted-foreground">{selectedExpert.bio || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Registration Date</p>
                          <p className="text-muted-foreground">
                            {new Date(selectedExpert.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {selectedExpert.verification_status === "pending" && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              className="flex-1"
                              onClick={() => handleVerifyExpert(selectedExpert.id, true)}
                              disabled={loading}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleVerifyExpert(selectedExpert.id, false)}
                              disabled={loading}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="h-full flex items-center justify-center min-h-[400px]">
                      <CardContent className="text-center text-muted-foreground">
                        <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select an expert to view details</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminPanel;
