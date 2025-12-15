import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Plus, Send } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
}

const Support = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTickets(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTickets(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
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

  const fetchTickets = async (userId: string) => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data);
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

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
    setShowNewTicketForm(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSubject.trim() || !initialMessage.trim()) return;

    setLoading(true);
    try {
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, subject: newSubject })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create first message
      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticketData.id,
          sender_id: user.id,
          content: initialMessage,
          is_admin: false
        });

      if (messageError) throw messageError;

      // Send notification email
      await supabase.functions.invoke("send-support-notification", {
        body: { ticketId: ticketData.id, type: "new_ticket" }
      });

      toast({
        title: "Ticket Created",
        description: "Our support team will respond shortly.",
      });

      setNewSubject("");
      setInitialMessage("");
      setShowNewTicketForm(false);
      fetchTickets(user.id);
      handleSelectTicket(ticketData);
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
          is_admin: false
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="container mx-auto px-4 py-12 flex-1">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Customer Support</CardTitle>
              <CardDescription>Please sign in to access customer support.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/auth"}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Customer Support</h1>
          <p className="text-xl text-muted-foreground mb-8">
            We're here to help. Create a support ticket and our team will respond as soon as possible.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Your Tickets</h2>
                <Button size="sm" onClick={() => setShowNewTicketForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
              <div className="space-y-2">
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
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
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
                    No tickets yet
                  </p>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2">
              <Card className="h-[500px] flex flex-col">
                {showNewTicketForm ? (
                  <CardContent className="p-6 flex-1">
                    <h3 className="font-semibold mb-4">Create New Support Ticket</h3>
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="Brief description of your issue"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={initialMessage}
                          onChange={(e) => setInitialMessage(e.target.value)}
                          placeholder="Describe your issue in detail"
                          rows={6}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          Create Ticket
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewTicketForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                ) : selectedTicket ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                          <CardDescription>
                            Ticket #{selectedTicket.id.slice(0, 8)} •{" "}
                            {selectedTicket.status === "open" ? "Open" : "Closed"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {msg.is_admin && msg.sender_id !== user?.id && (
                              <p className="text-xs font-semibold mb-1 text-destructive">Admin</p>
                            )}
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
                            placeholder="Type your message..."
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
                      <p>Select a ticket or create a new one</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Support;
