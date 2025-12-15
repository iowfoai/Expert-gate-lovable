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
import { Search, UserPlus, Check, Clock, Users, Building2, FlaskConical, Handshake } from "lucide-react";
import CollaborationRequestDialog from "@/components/CollaborationRequestDialog";

interface Researcher {
  id: string;
  full_name: string;
  bio: string | null;
  research_institution: string | null;
  research_field: string[] | null;
  profile_image_url: string | null;
  country: string | null;
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const userId = session.user.id;
      setCurrentUserId(userId);

      // Ensure the current user has a profile row (required for connection foreign keys)
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

      // Fetch all researchers except current user
      const { data: researchersData, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, research_institution, research_field, profile_image_url, country')
        .eq('user_type', 'researcher')
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
  }, [navigate]);

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

    const { error } = await supabase
      .from('expert_connections')
      .insert({
        requester_id: currentUserId,
        recipient_id: researcherId,
        status: 'pending',
        connection_type: 'friend'
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive"
      });
      return;
    }

    setConnectionStatuses(prev => ({
      ...prev,
      [researcherId]: 'pending_sent'
    }));

    toast({
      title: "Request Sent",
      description: "Connection request sent successfully!"
    });
  };

  const acceptConnection = async (researcherId: string) => {
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

    setConnectionStatuses(prev => ({
      ...prev,
      [researcherId]: 'accepted'
    }));

    toast({
      title: "Connected!",
      description: "You are now connected with this researcher"
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Researcher Directory</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
            <Card key={researcher.id} className="hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={researcher.profile_image_url || undefined} />
                    <AvatarFallback className="bg-accent/10 text-accent font-medium">
                      {getInitials(researcher.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{researcher.full_name}</h3>
                    {researcher.research_institution && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {researcher.research_institution}
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
      </main>

      <Footer />

      {selectedResearcher && (
        <CollaborationRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          researcher={selectedResearcher}
          onSuccess={() => handleCollaborationSent(selectedResearcher.id)}
        />
      )}
    </div>
  );
};

export default ResearchersDirectory;
