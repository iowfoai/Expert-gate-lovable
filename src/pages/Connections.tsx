import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Send, ArrowLeft, Check, X, GraduationCap, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Connection {
  id: string;
  status: string;
  created_at: string;
  requester_id: string;
  recipient_id: string;
  other_user: {
    id: string;
    full_name: string;
    institution: string;
    field_of_expertise: string[];
    profile_image_url: string | null;
    user_type: string;
  };
  is_requester: boolean;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

const Connections = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("experts");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check auth and get user type
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();
      
      setUserId(session.user.id);
      setUserType(profile?.user_type || null);
      
      // Set default tab based on user type
      if (profile?.user_type === 'researcher') {
        setActiveTab('experts');
      } else {
        setActiveTab('researchers');
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch connections
  useEffect(() => {
    if (!userId) return;

    const fetchConnections = async () => {
      setLoading(true);
      
      const { data: connectionsData, error } = await supabase
        .from('expert_connections')
        .select('*')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections:', error);
        setLoading(false);
        return;
      }

      const otherUserIds = connectionsData?.map(c => 
        c.requester_id === userId ? c.recipient_id : c.requester_id
      ) || [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, institution, field_of_expertise, profile_image_url, user_type')
        .in('id', otherUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedConnections: Connection[] = (connectionsData || []).map(c => ({
        ...c,
        other_user: profilesMap.get(c.requester_id === userId ? c.recipient_id : c.requester_id) || {
          id: '',
          full_name: 'Unknown User',
          institution: '',
          field_of_expertise: [],
          profile_image_url: null,
          user_type: 'researcher'
        },
        is_requester: c.requester_id === userId
      }));

      setConnections(enrichedConnections.filter(c => c.status === 'accepted'));
      setPendingRequests(enrichedConnections.filter(c => c.status === 'pending'));
      setLoading(false);

      // Auto-open chat if URL has chat param
      const chatId = searchParams.get('chat');
      if (chatId) {
        const targetConnection = enrichedConnections.find(c => c.id === chatId);
        if (targetConnection) {
          setSelectedConnection(targetConnection);
          // Switch to correct tab
          if (targetConnection.other_user.user_type === 'expert') {
            setActiveTab('experts');
          } else {
            setActiveTab('researchers');
          }
        }
      }
    };

    fetchConnections();

    const channel = supabase
      .channel('connections-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expert_connections',
        filter: `requester_id=eq.${userId}`
      }, () => fetchConnections())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expert_connections',
        filter: `recipient_id=eq.${userId}`
      }, () => fetchConnections())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, searchParams]);

  // Fetch messages for selected connection
  useEffect(() => {
    if (!selectedConnection || !userId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', selectedConnection.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedConnection.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${selectedConnection.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConnection, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAcceptRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from('expert_connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (error) {
      toast({ title: "Error", description: "Failed to accept connection request", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Connection request accepted!" });
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    const { error } = await supabase
      .from('expert_connections')
      .update({ status: 'declined' })
      .eq('id', connectionId);

    if (error) {
      toast({ title: "Error", description: "Failed to decline connection request", variant: "destructive" });
    } else {
      toast({ title: "Request Declined", description: "Connection request has been declined" });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection || !userId) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedConnection.id,
        sender_id: userId,
        content: newMessage.trim()
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const expertConnections = connections.filter(c => c.other_user.user_type === 'expert');
  const researcherConnections = connections.filter(c => c.other_user.user_type === 'researcher');
  const expertPending = pendingRequests.filter(c => c.other_user.user_type === 'expert');
  const researcherPending = pendingRequests.filter(c => c.other_user.user_type === 'researcher');

  const renderConnectionsList = (conns: Connection[], pending: Connection[]) => (
    <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
      {pending.filter(r => !r.is_requester).length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">Pending Requests</p>
          {pending.filter(r => !r.is_requester).map((request) => (
            <div key={request.id} className="p-3 rounded-lg bg-accent/10 border border-accent/20 mb-2">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={request.other_user.profile_image_url || ''} />
                  <AvatarFallback>{getInitials(request.other_user.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{request.other_user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{request.other_user.institution}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleAcceptRequest(request.id)}>
                  <Check className="w-4 h-4 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeclineRequest(request.id)}>
                  <X className="w-4 h-4 mr-1" /> Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.filter(r => r.is_requester).length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">Sent Requests</p>
          {pending.filter(r => r.is_requester).map((request) => (
            <div key={request.id} className="p-3 rounded-lg bg-muted/50 mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={request.other_user.profile_image_url || ''} />
                  <AvatarFallback>{getInitials(request.other_user.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{request.other_user.full_name}</p>
                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-4">
        {conns.length > 0 && (
          <p className="text-sm font-medium text-muted-foreground mb-2">Connected</p>
        )}
        {conns.map((connection) => (
          <button
            key={connection.id}
            onClick={() => setSelectedConnection(connection)}
            className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
              selectedConnection?.id === connection.id 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={connection.other_user.profile_image_url || ''} />
                <AvatarFallback>{getInitials(connection.other_user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{connection.other_user.full_name}</p>
                <p className="text-xs opacity-80 truncate">{connection.other_user.institution}</p>
              </div>
              <MessageSquare className="w-4 h-4 opacity-60" />
            </div>
          </button>
        ))}

        {conns.length === 0 && pending.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No connections yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-accent" />
            Connections
          </h1>
          <p className="text-muted-foreground">Chat with experts and researchers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connections List with Tabs */}
          <Card className="lg:col-span-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <CardHeader className="pb-2">
                <TabsList className="w-full">
                  <TabsTrigger value="experts" className="flex-1 gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Experts
                  </TabsTrigger>
                  <TabsTrigger value="researchers" className="flex-1 gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Researchers
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="experts" className="m-0">
                  {renderConnectionsList(expertConnections, expertPending)}
                </TabsContent>
                <TabsContent value="researchers" className="m-0">
                  {renderConnectionsList(researcherConnections, researcherPending)}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
            {selectedConnection ? (
              <>
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedConnection(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConnection.other_user.profile_image_url || ''} />
                      <AvatarFallback>{getInitials(selectedConnection.other_user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConnection.other_user.full_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {selectedConnection.other_user.user_type === 'expert' ? 'Expert' : 'Researcher'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{selectedConnection.other_user.institution}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.sender_id === userId
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <form onSubmit={handleSendMessage} className="p-4 border-t flex-shrink-0">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a connection to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Connections;
