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
import { Users, MessageSquare, Send, ArrowLeft, Check, X, GraduationCap, FlaskConical, Handshake, Circle, Calendar, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface Connection {
  id: string;
  status: string;
  created_at: string;
  requester_id: string;
  recipient_id: string;
  connection_type: string;
  other_user: {
    id: string;
    full_name: string;
    institution: string;
    field_of_expertise: string[];
    profile_image_url: string | null;
    user_type: string;
  };
  is_requester: boolean;
  has_unread: boolean;
}

interface CollaborationRequest {
  id: string;
  expert_id: string;
  researcher_id: string;
  topic: string;
  message: string | null;
  status: string;
  created_at: string;
  expert?: {
    id: string;
    full_name: string;
    institution: string | null;
    profile_image_url: string | null;
  };
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
  const { unreadConnectionIds, markAsRead } = useUnreadMessages();
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("researchers");
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
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
        setActiveTab('researchers');
      } else {
        setActiveTab('experts');
      }
    };

    checkAuth();
  }, [navigate]);

  // Fetch connections and collaboration requests
  useEffect(() => {
    if (!userId || !userType) return;

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

      const enrichedConnections: Connection[] = (connectionsData || []).map(c => {
        const isRequester = c.requester_id === userId;
        return {
          ...c,
          connection_type: c.connection_type || 'friend',
          other_user: profilesMap.get(c.requester_id === userId ? c.recipient_id : c.requester_id) || {
            id: '',
            full_name: 'Unknown User',
            institution: '',
            field_of_expertise: [],
            profile_image_url: null,
            user_type: 'researcher'
          },
          is_requester: isRequester,
          has_unread: unreadConnectionIds.has(c.id)
        };
      });

      setConnections(enrichedConnections.filter(c => c.status === 'accepted'));
      setPendingRequests(enrichedConnections.filter(c => c.status === 'pending'));

      // Fetch collaboration requests for researchers
      if (userType === 'researcher') {
        const { data: collabData } = await supabase
          .from('collaboration_requests')
          .select(`
            id,
            expert_id,
            researcher_id,
            topic,
            message,
            status,
            created_at
          `)
          .eq('researcher_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (collabData && collabData.length > 0) {
          const expertIds = collabData.map(c => c.expert_id);
          const { data: expertProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, institution, profile_image_url')
            .in('id', expertIds);

          const expertMap = new Map(expertProfiles?.map(p => [p.id, p]) || []);
          
          const enrichedCollabs = collabData.map(c => ({
            ...c,
            expert: expertMap.get(c.expert_id)
          }));
          
          setCollaborationRequests(enrichedCollabs);
        } else {
          setCollaborationRequests([]);
        }
      }

      setLoading(false);

      // Auto-open chat if URL has chat param
      const chatId = searchParams.get('chat');
      if (chatId) {
        const targetConnection = enrichedConnections.find(c => c.id === chatId);
        if (targetConnection) {
          setSelectedConnection(targetConnection);
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'collaboration_requests',
        filter: `researcher_id=eq.${userId}`
      }, () => fetchConnections())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType, searchParams, unreadConnectionIds]);

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
    
    // Mark as read when opening chat (outside of the fetch to avoid dependency issues)
    if (selectedConnection.has_unread) {
      markAsRead(selectedConnection.id);
    }


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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConnection?.id, userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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

  const handleAcceptCollaboration = async (collabRequest: CollaborationRequest) => {
    // Update collaboration request status
    const { error: collabError } = await supabase
      .from('collaboration_requests')
      .update({ status: 'accepted' })
      .eq('id', collabRequest.id);

    if (collabError) {
      toast({ title: "Error", description: "Failed to accept collaboration", variant: "destructive" });
      return;
    }

    // Create a connection for the collaboration
    const { error: connError } = await supabase
      .from('expert_connections')
      .insert({
        requester_id: collabRequest.expert_id,
        recipient_id: collabRequest.researcher_id,
        status: 'accepted',
        connection_type: 'collaboration'
      });

    if (connError) {
      console.error('Error creating connection:', connError);
    }

    toast({ title: "Success", description: "Collaboration request accepted!" });
  };

  const handleDeclineCollaboration = async (collabId: string) => {
    const { error } = await supabase
      .from('collaboration_requests')
      .update({ status: 'declined' })
      .eq('id', collabId);

    if (error) {
      toast({ title: "Error", description: "Failed to decline collaboration", variant: "destructive" });
    } else {
      toast({ title: "Declined", description: "Collaboration request declined" });
    }
  };

  const handleMarkAsDone = async (connectionId: string) => {
    // Delete the connection to remove chat
    const { error } = await supabase
      .from('expert_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({ title: "Error", description: "Failed to mark as done", variant: "destructive" });
    } else {
      toast({ title: "Marked as Done", description: "Interview/Collaboration marked as complete" });
      setSelectedConnection(null);
    }
  };

  const handleDeleteFriendConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from('expert_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete connection", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Connection removed" });
      if (selectedConnection?.id === connectionId) {
        setSelectedConnection(null);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection || !userId) return;

    // Insert message
    const { error } = await supabase
      .from('messages')
      .insert({
        connection_id: selectedConnection.id,
        sender_id: userId,
        content: newMessage.trim()
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      return;
    }

    // Mark as unread for the other user
    const isRequester = selectedConnection.requester_id === userId;
    const updateField = isRequester ? 'has_unread_for_recipient' : 'has_unread_for_requester';
    
    await supabase
      .from('expert_connections')
      .update({ [updateField]: true })
      .eq('id', selectedConnection.id);

    setNewMessage("");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter connections based on user type and active tab
  const getFilteredConnections = () => {
    if (userType === 'researcher') {
      if (activeTab === 'researchers') {
        // Friend connections with other researchers
        return connections.filter(c => 
          c.other_user.user_type === 'researcher' && c.connection_type === 'friend'
        );
      } else if (activeTab === 'interviews') {
        // Interview connections with experts
        return connections.filter(c => 
          c.other_user.user_type === 'expert' && c.connection_type === 'interview'
        );
      } else if (activeTab === 'collaborations') {
        // Collaboration connections with experts
        return connections.filter(c => 
          c.other_user.user_type === 'expert' && c.connection_type === 'collaboration'
        );
      }
    } else {
      // Expert view
      if (activeTab === 'experts') {
        // Friend connections with other experts
        return connections.filter(c => 
          c.other_user.user_type === 'expert' && c.connection_type === 'friend'
        );
      } else if (activeTab === 'interviews') {
        // Interview connections with researchers
        return connections.filter(c => 
          c.other_user.user_type === 'researcher' && c.connection_type === 'interview'
        );
      } else if (activeTab === 'collaborations') {
        // Collaboration connections with researchers
        return connections.filter(c => 
          c.other_user.user_type === 'researcher' && c.connection_type === 'collaboration'
        );
      }
    }
    return [];
  };

  const getFilteredPending = () => {
    if (userType === 'researcher') {
      if (activeTab === 'researchers') {
        return pendingRequests.filter(c => 
          c.other_user.user_type === 'researcher' && c.connection_type === 'friend'
        );
      } else if (activeTab === 'interviews') {
        return pendingRequests.filter(c => 
          c.other_user.user_type === 'expert' && c.connection_type === 'interview'
        );
      } else if (activeTab === 'collaborations') {
        return pendingRequests.filter(c => 
          c.other_user.user_type === 'expert' && c.connection_type === 'collaboration'
        );
      }
    } else {
      if (activeTab === 'experts') {
        return pendingRequests.filter(c => 
          c.other_user.user_type === 'expert' && c.connection_type === 'friend'
        );
      } else if (activeTab === 'interviews') {
        return pendingRequests.filter(c => 
          c.other_user.user_type === 'researcher' && c.connection_type === 'interview'
        );
      } else if (activeTab === 'collaborations') {
        return pendingRequests.filter(c => 
          c.other_user.user_type === 'researcher' && c.connection_type === 'collaboration'
        );
      }
    }
    return [];
  };

  const isFriendConnection = (connection: Connection) => {
    return connection.connection_type === 'friend';
  };

  const renderConnectionsList = () => {
    const conns = getFilteredConnections();
    const pending = getFilteredPending();

    return (
      <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px]">
        {/* Collaboration requests for researchers */}
        {userType === 'researcher' && activeTab === 'collaborations' && collaborationRequests.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Collaboration Requests
            </p>
            {collaborationRequests.map((request) => (
              <div key={request.id} className="p-3 rounded-lg bg-accent/10 border border-accent/20 mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.expert?.profile_image_url || ''} />
                    <AvatarFallback>{getInitials(request.expert?.full_name || 'E')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.expert?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{request.topic}</p>
                  </div>
                </div>
                {request.message && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{request.message}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAcceptCollaboration(request)}>
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDeclineCollaboration(request.id)}>
                    <X className="w-4 h-4 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
            <div
              key={connection.id}
              className="relative mb-2"
              onMouseEnter={() => setHoveredConnectionId(connection.id)}
              onMouseLeave={() => setHoveredConnectionId(null)}
            >
              <button
                onClick={() => setSelectedConnection(connection)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedConnection?.id === connection.id 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={connection.other_user.profile_image_url || ''} />
                      <AvatarFallback>{getInitials(connection.other_user.full_name)}</AvatarFallback>
                    </Avatar>
                    {connection.has_unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{connection.other_user.full_name}</p>
                      {connection.connection_type === 'interview' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                          <Calendar className="w-2.5 h-2.5 mr-0.5" />
                          Interview
                        </Badge>
                      )}
                      {connection.connection_type === 'collaboration' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                          <Handshake className="w-2.5 h-2.5 mr-0.5" />
                          Collab
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-80 truncate">{connection.other_user.institution}</p>
                  </div>
                  {connection.has_unread && (
                    <Circle className="w-4 h-4 fill-destructive text-destructive shrink-0" />
                  )}
                </div>
              </button>
              
              {/* Delete button for friend connections */}
              {isFriendConnection(connection) && hoveredConnectionId === connection.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFriendConnection(connection.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                  title="Remove connection"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {conns.length === 0 && pending.length === 0 && collaborationRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No connections yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const getTabLabel = (tab: string) => {
    if (userType === 'researcher') {
      return tab === 'researchers' ? 'Researchers' : 'Interviews';
    } else {
      return tab === 'experts' ? 'Experts' : 'Collaborations';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-accent" />
            Connections
          </h1>
          <p className="text-muted-foreground">Chat with your network</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connections List with Tabs */}
          <Card className="lg:col-span-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setSelectedConnection(null); }} className="h-full">
              <CardHeader className="pb-2">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value={userType === 'researcher' ? 'researchers' : 'experts'} className="gap-1 text-xs px-2">
                    {userType === 'researcher' ? (
                      <><FlaskConical className="w-3.5 h-3.5" />Peers</>
                    ) : (
                      <><GraduationCap className="w-3.5 h-3.5" />Peers</>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="interviews" className="gap-1 text-xs px-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Interviews
                  </TabsTrigger>
                  <TabsTrigger value="collaborations" className="gap-1 text-xs px-2">
                    <Handshake className="w-3.5 h-3.5" />
                    Collabs
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value={userType === 'researcher' ? 'researchers' : 'experts'} className="m-0">
                  {renderConnectionsList()}
                </TabsContent>
                <TabsContent value="interviews" className="m-0">
                  {renderConnectionsList()}
                </TabsContent>
                <TabsContent value="collaborations" className="m-0">
                  {renderConnectionsList()}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col min-h-[500px]">
            {selectedConnection ? (
              <>
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
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
                          {selectedConnection.connection_type !== 'friend' && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {selectedConnection.connection_type}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">{selectedConnection.other_user.institution}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* End Interview/Collaboration button - only for cross-type connections */}
                    {!isFriendConnection(selectedConnection) && 
                     selectedConnection.other_user.user_type !== userType && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMarkAsDone(selectedConnection.id)}
                        className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                        {selectedConnection.connection_type === 'interview' ? 'End Interview' : 'End Collaboration'}
                      </Button>
                    )}
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
