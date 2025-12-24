import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Check, Clock, Users, Building2, FlaskConical, Handshake, Globe, Megaphone, Plus, X, Loader2 } from "lucide-react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import CollaborationRequestDialog from "@/components/CollaborationRequestDialog";
import CreateCollaborationPostDialog from "@/components/CreateCollaborationPostDialog";
import CollaborationPostCard, { type CollaborationPost } from "@/components/CollaborationPostCard";
import { EditableText } from "@/components/EditableText";
import { EditableProfileField } from "@/components/EditableProfileField";

interface Researcher {
  id: string;
  full_name: string;
  bio: string | null;
  research_institution: string | null;
  research_field: string[] | null;
  profile_image_url: string | null;
  country: string | null;
  preferred_languages: string[] | null;
  is_test_account: boolean;
}

interface ConnectionStatus {
  [researcherId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

interface CollaborationStatus {
  [researcherId: string]: 'none' | 'pending' | 'accepted';
}

const ResearchersDirectory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminStatus();
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [filteredResearchers, setFilteredResearchers] = useState<Researcher[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus>({});
  const [collaborationStatuses, setCollaborationStatuses] = useState<CollaborationStatus>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Collaboration posts state
  const [collaborationPosts, setCollaborationPosts] = useState<CollaborationPost[]>([]);
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);

  const fetchCollaborationPosts = async (userId: string) => {
    const { data: posts, error } = await supabase
      .from('collaboration_posts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    if (posts && posts.length > 0) {
      // Fetch author profiles
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image_url, user_type, institution, research_institution')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch user's applications
      const { data: userApps } = await supabase
        .from('collaboration_applications')
        .select('post_id, status')
        .eq('applicant_id', userId);

      const appMap = new Map(userApps?.map(a => [a.post_id, a.status]) || []);

      // Fetch application counts for user's own posts
      const userPostIds = posts.filter(p => p.author_id === userId).map(p => p.id);
      let appCounts: Record<string, number> = {};
      
      if (userPostIds.length > 0) {
        const { data: counts } = await supabase
          .from('collaboration_applications')
          .select('post_id')
          .in('post_id', userPostIds)
          .eq('status', 'pending');
        
        counts?.forEach(c => {
          appCounts[c.post_id] = (appCounts[c.post_id] || 0) + 1;
        });
      }

      const enriched: CollaborationPost[] = posts.map(post => ({
        ...post,
        author: profileMap.get(post.author_id),
        application_status: post.author_id === userId ? undefined : (appMap.get(post.id) as any || 'none'),
        application_count: appCounts[post.id] || 0,
      }));

      setCollaborationPosts(enriched);
    } else {
      setCollaborationPosts([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const userId = session.user.id;
      setCurrentUserId(userId);

      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const metaUserType = session.user.user_metadata?.user_type;
      const safeUserType =
        metaUserType === 'expert' || metaUserType === 'researcher' ? metaUserType : 'researcher';

      const safeFullName =
        (typeof session.user.user_metadata?.full_name === 'string' &&
          session.user.user_metadata.full_name.trim()) ||
        'User';

      let profile = existingProfile;
      if (!profile) {
        const { data: inserted, error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: session.user.email ?? '',
            full_name: safeFullName,
            user_type: safeUserType,
          })
          .select('user_type')
          .maybeSingle();

        if (insertProfileError) {
          console.error('Error creating profile:', insertProfileError);
          toast({
            title: 'Error',
            description: insertProfileError.message || 'Failed to set up your account profile.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        profile = inserted;
      }

      const effectiveUserType = profile?.user_type ?? safeUserType;
      setUserType(effectiveUserType);

      // Fetch collaboration posts
      await fetchCollaborationPosts(userId);

      // Fetch all researchers except current user
      const { data: researchersData, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, research_institution, research_field, profile_image_url, country, preferred_languages, is_test_account')
        .eq('user_type', 'researcher')
        .eq('is_test_account', false)
        .neq('id', userId);

      if (error) {
        console.error('Error fetching researchers:', error);
        setLoading(false);
        return;
      }

      setResearchers(researchersData || []);
      setFilteredResearchers(researchersData || []);

      // For researchers: fetch friend connection statuses
      if (effectiveUserType === 'researcher') {
        const { data: connections } = await supabase
          .from('expert_connections')
          .select('requester_id, recipient_id, status, connection_type')
          .eq('connection_type', 'friend')
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

        const statuses: ConnectionStatus = {};
        connections?.forEach((conn) => {
          const otherUserId = conn.requester_id === userId ? conn.recipient_id : conn.requester_id;
          if (conn.status === 'accepted') {
            statuses[otherUserId] = 'accepted';
          } else if (conn.status === 'pending') {
            statuses[otherUserId] = conn.requester_id === userId ? 'pending_sent' : 'pending_received';
          }
        });
        setConnectionStatuses(statuses);
      }

      // For experts: fetch collaboration request statuses
      if (effectiveUserType === 'expert') {
        const { data: collabs } = await supabase
          .from('collaboration_requests')
          .select('researcher_id, status')
          .eq('expert_id', userId);

        const statuses: CollaborationStatus = {};
        collabs?.forEach((collab) => {
          if (collab.status === 'accepted') {
            statuses[collab.researcher_id] = 'accepted';
          } else if (collab.status === 'pending') {
            statuses[collab.researcher_id] = 'pending';
          }
        });
        setCollaborationStatuses(statuses);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate, toast]);

  // Realtime subscription for connection status updates
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('researcher-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expert_connections',
        },
        (payload) => {
          const record = payload.new as {
            requester_id: string;
            recipient_id: string;
            status: string;
            connection_type: string;
          } | null;

          if (!record) return;

          if (record.connection_type !== 'friend') return;
          if (record.requester_id !== currentUserId && record.recipient_id !== currentUserId) return;

          const otherUserId =
            record.requester_id === currentUserId ? record.recipient_id : record.requester_id;

          setConnectionStatuses((prev) => {
            if (record.status === 'accepted') {
              return { ...prev, [otherUserId]: 'accepted' };
            } else if (record.status === 'pending') {
              return {
                ...prev,
                [otherUserId]: record.requester_id === currentUserId ? 'pending_sent' : 'pending_received',
              };
            } else if (record.status === 'rejected') {
              const updated = { ...prev };
              delete updated[otherUserId];
              return updated;
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    const filtered = researchers.filter(researcher => {
      const searchLower = searchQuery.toLowerCase();
      return (
        researcher.full_name.toLowerCase().includes(searchLower) ||
        researcher.research_institution?.toLowerCase().includes(searchLower) ||
        researcher.research_field?.some(f => f.toLowerCase().includes(searchLower)) ||
        researcher.country?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredResearchers(filtered);
  }, [searchQuery, researchers]);

  const sendConnectionRequest = async (researcherId: string) => {
    if (!currentUserId) return;

    const { data: connectionData, error } = await supabase
      .from('expert_connections')
      .insert({
        requester_id: currentUserId,
        recipient_id: researcherId,
        status: 'pending',
        connection_type: 'friend'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
      return;
    }

    // Send email notification
    if (connectionData) {
      supabase.functions.invoke('send-connection-notification', {
        body: { type: 'connection_request', connectionId: connectionData.id }
      }).catch(err => console.error('Error sending notification email:', err));
    }

    setConnectionStatuses(prev => ({
      ...prev,
      [researcherId]: 'pending_sent'
    }));

    toast({
      title: "Request Sent",
      description: "Connection request sent successfully!",
      duration: 10000,
    });
  };

  const acceptConnection = async (researcherId: string) => {
    // First get the connection id
    const { data: connectionData } = await supabase
      .from('expert_connections')
      .select('id')
      .eq('requester_id', researcherId)
      .eq('recipient_id', currentUserId)
      .single();

    const { error } = await supabase
      .from('expert_connections')
      .update({ status: 'accepted' })
      .eq('requester_id', researcherId)
      .eq('recipient_id', currentUserId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept connection",
        variant: "destructive"
      });
      return;
    }

    // Send email notification
    if (connectionData) {
      supabase.functions.invoke('send-connection-notification', {
        body: { type: 'connection_accepted', connectionId: connectionData.id }
      }).catch(err => console.error('Error sending notification email:', err));
    }

    setConnectionStatuses(prev => ({
      ...prev,
      [researcherId]: 'accepted'
    }));

    // Get the researcher name from the list
    const researcher = researchers.find(r => r.id === researcherId);
    const researcherName = researcher?.full_name || "Researcher";
    
    toast({
      title: "Request Accepted",
      description: `Request accepted, you may now chat with ${researcherName} (Researcher)`,
      duration: 10000,
    });
  };

  const handleCollaborateClick = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setDialogOpen(true);
  };

  const handleCollaborationSent = (researcherId: string) => {
    setCollaborationStatuses(prev => ({
      ...prev,
      [researcherId]: 'pending'
    }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAdminDelete = async (researcherId: string) => {
    if (!isAdmin) return;
    
    setDeletingId(researcherId);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq("id", researcherId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    } else {
      toast({
        title: "User Deleted",
        description: "The user account has been deactivated"
      });
      setResearchers(prev => prev.filter(r => r.id !== researcherId));
      setFilteredResearchers(prev => prev.filter(r => r.id !== researcherId));
    }
    setDeletingId(null);
  };

  const handlePostCreated = () => {
    if (currentUserId) {
      fetchCollaborationPosts(currentUserId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <FlaskConical className="w-8 h-8 text-accent" />
          </div>
          <EditableText 
            contentKey="research_collab_title" 
            defaultValue="Research Collab" 
            as="h1" 
            className="text-3xl md:text-4xl font-bold mb-4" 
          />
          <EditableText 
            contentKey="research_collab_subtitle" 
            defaultValue="Find collaborators for your research projects or join exciting ongoing research" 
            as="p" 
            className="text-muted-foreground max-w-2xl mx-auto" 
          />
        </div>

        {/* Collaboration Posts Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-accent" />
              <EditableText 
                contentKey="collab_posts_heading" 
                defaultValue="Calls for Collaboration" 
                as="h2" 
                className="text-xl font-semibold" 
              />
            </div>
            <Button onClick={() => setCreatePostDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Post Collaboration
            </Button>
          </div>

          {collaborationPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collaborationPosts.map((post) => (
                <CollaborationPostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                  onRefresh={handlePostCreated}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="py-8 text-center">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No collaboration posts yet. Be the first to post!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Researchers Section */}
        <div className="border-t pt-12">
          <div className="text-center mb-8">
            <EditableText 
              contentKey="browse_researchers_heading" 
              defaultValue="Browse Researchers" 
              as="h2" 
              className="text-xl font-semibold mb-2" 
            />
            <p className="text-muted-foreground">
              {userType === 'expert' 
                ? 'Find researchers to collaborate with on exciting projects'
                : 'Connect with fellow researchers and expand your network'}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, institution, research field, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results Count */}
          <p className="text-muted-foreground mb-6">
            {filteredResearchers.length} researcher{filteredResearchers.length !== 1 ? 's' : ''} found
          </p>

          {/* Researchers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResearchers.map((researcher) => (
              <Card key={researcher.id} className="hover:border-accent/50 transition-all hover:shadow-lg relative">
                {/* Admin-only test account label */}
                {isAdmin && researcher.is_test_account && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-xs italic text-muted-foreground bg-background/80 px-2 py-1 rounded">Visible only to admins</span>
                  </div>
                )}
                {/* Admin delete button */}
                {isAdmin && (
                  <button
                    onClick={() => handleAdminDelete(researcher.id)}
                    disabled={deletingId === researcher.id}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    title="Delete user (Admin)"
                  >
                    {deletingId === researcher.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={researcher.profile_image_url || undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent font-medium">
                        {getInitials(researcher.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        <EditableProfileField
                          userId={researcher.id}
                          field="full_name"
                          value={researcher.full_name}
                          className="font-semibold text-lg"
                        />
                      </h3>
                      {researcher.research_institution && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <EditableProfileField
                            userId={researcher.id}
                            field="research_institution"
                            value={researcher.research_institution}
                            className="text-sm text-muted-foreground"
                          />
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    {researcher.research_field && researcher.research_field.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {researcher.research_field.slice(0, 3).map((field, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                        {researcher.research_field.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{researcher.research_field.length - 3}
                          </Badge>
                        )}
                      </div>
                      )}

                    {researcher.preferred_languages && researcher.preferred_languages.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{researcher.preferred_languages.join(', ')}</span>
                      </div>
                    )}

                    {researcher.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {researcher.bio}
                      </p>
                    )}
                  </div>

                  {/* Connection/Collaboration Button */}
                  <div className="pt-3 border-t border-border">
                    {userType === 'expert' ? (
                      // Expert view - show collaborate button
                      collaborationStatuses[researcher.id] === 'accepted' ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Check className="w-4 h-4 mr-2" />
                          Collaborating
                        </Button>
                      ) : collaborationStatuses[researcher.id] === 'pending' ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Clock className="w-4 h-4 mr-2" />
                          Request Pending
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => handleCollaborateClick(researcher)}>
                          <Handshake className="w-4 h-4 mr-2" />
                          Collaborate
                        </Button>
                      )
                    ) : (
                      // Researcher view - show connect button
                      connectionStatuses[researcher.id] === 'accepted' ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Check className="w-4 h-4 mr-2" />
                          Connected
                        </Button>
                      ) : connectionStatuses[researcher.id] === 'pending_sent' ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Clock className="w-4 h-4 mr-2" />
                          Request Pending
                        </Button>
                      ) : connectionStatuses[researcher.id] === 'pending_received' ? (
                        <Button className="w-full" onClick={() => acceptConnection(researcher.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Accept Request
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => sendConnectionRequest(researcher.id)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredResearchers.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium mb-2">No researchers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedResearcher && (
        <CollaborationRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          researcher={{
            id: selectedResearcher.id,
            full_name: selectedResearcher.full_name,
          }}
          researcherLanguages={selectedResearcher.preferred_languages || ['English']}
          onSuccess={() => handleCollaborationSent(selectedResearcher.id)}
        />
      )}

      <CreateCollaborationPostDialog
        open={createPostDialogOpen}
        onOpenChange={setCreatePostDialogOpen}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default ResearchersDirectory;
