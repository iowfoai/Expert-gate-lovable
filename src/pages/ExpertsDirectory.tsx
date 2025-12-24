import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserTypeGuard } from "@/hooks/useUserTypeGuard";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Search, UserPlus, Check, Clock, Users, GraduationCap, Building2, AlertCircle, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditableText } from "@/components/EditableText";
import { EditableProfileField } from "@/components/EditableProfileField";

interface Expert {
  id: string;
  full_name: string;
  bio: string | null;
  institution: string | null;
  field_of_expertise: string[] | null;
  education_level: string | null;
  years_of_experience: number | null;
  profile_image_url: string | null;
  country: string | null;
  verification_status: string | null;
  is_test_account: boolean;
}

interface ConnectionStatus {
  [expertId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

const ExpertsDirectory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading: authLoading, userId: currentUserId } = useUserTypeGuard(['expert']);
  const { isAdmin } = useAdminStatus();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserVerified, setCurrentUserVerified] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !currentUserId) return;
    
    const fetchData = async () => {
      // First check if current user is verified
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', currentUserId)
        .single();

      setCurrentUserVerified(currentProfile?.verification_status === 'verified');

      // Fetch all verified experts except current user
      const { data: expertsData, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, institution, field_of_expertise, education_level, years_of_experience, profile_image_url, country, verification_status, is_test_account')
        .eq('user_type', 'expert')
        .eq('verification_status', 'verified')
        .eq('is_test_account', false)
        .neq('id', currentUserId);

      if (error) {
        console.error('Error fetching experts:', error);
        return;
      }

      setExperts(expertsData || []);
      setFilteredExperts(expertsData || []);

      // Fetch connection statuses
      const { data: connections } = await supabase
        .from('expert_connections')
        .select('requester_id, recipient_id, status')
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

      const statuses: ConnectionStatus = {};
      connections?.forEach(conn => {
        const otherUserId = conn.requester_id === currentUserId ? conn.recipient_id : conn.requester_id;
        if (conn.status === 'accepted') {
          statuses[otherUserId] = 'accepted';
        } else if (conn.status === 'pending') {
          statuses[otherUserId] = conn.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
        }
      });
      setConnectionStatuses(statuses);
      setLoading(false);
    };

    fetchData();
  }, [authLoading, currentUserId]);

  useEffect(() => {
    const filtered = experts.filter(expert => {
      const searchLower = searchQuery.toLowerCase();
      return (
        expert.full_name.toLowerCase().includes(searchLower) ||
        expert.institution?.toLowerCase().includes(searchLower) ||
        expert.field_of_expertise?.some(f => f.toLowerCase().includes(searchLower)) ||
        expert.country?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredExperts(filtered);
  }, [searchQuery, experts]);

  const sendConnectionRequest = async (expertId: string) => {
    if (!currentUserId) return;

    if (!currentUserVerified) {
      toast({
        title: "Verification Required",
        description: "Your account must be verified before you can connect with other experts.",
        variant: "destructive"
      });
      return;
    }

    const { data: connectionData, error } = await supabase
      .from('expert_connections')
      .insert({
        requester_id: currentUserId,
        recipient_id: expertId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
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
      [expertId]: 'pending_sent'
    }));

    toast({
      title: "Request Sent",
      description: "Connection request sent successfully!",
      duration: 10000,
    });
  };

  const acceptConnection = async (expertId: string) => {
    if (!currentUserVerified) {
      toast({
        title: "Verification Required",
        description: "Your account must be verified before you can accept connection requests.",
        variant: "destructive"
      });
      return;
    }

    // First get the connection id
    const { data: connectionData } = await supabase
      .from('expert_connections')
      .select('id')
      .eq('requester_id', expertId)
      .eq('recipient_id', currentUserId)
      .single();

    const { error } = await supabase
      .from('expert_connections')
      .update({ status: 'accepted' })
      .eq('requester_id', expertId)
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
      [expertId]: 'accepted'
    }));

    // Get the expert name from the list
    const expert = experts.find(e => e.id === expertId);
    const expertName = expert?.full_name || "Expert";
    
    toast({
      title: "Request Accepted",
      description: `Request accepted, you may now chat with ${expertName} (Expert)`,
      duration: 10000,
    });
  };

  const getEducationLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      bachelors: "Bachelor's",
      masters: "Master's",
      phd: "PhD",
      postdoc: "Postdoctoral",
      professor: "Professor",
      industry_professional: "Industry Professional"
    };
    return level ? labels[level] || level : null;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAdminDelete = async (expertId: string) => {
    if (!isAdmin) return;
    
    setDeletingId(expertId);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq("id", expertId);

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
      setExperts(prev => prev.filter(e => e.id !== expertId));
      setFilteredExperts(prev => prev.filter(e => e.id !== expertId));
    }
    setDeletingId(null);
  };

  if (loading || authLoading) {
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
            <Users className="w-8 h-8 text-accent" />
          </div>
          <EditableText 
            contentKey="experts_directory_title" 
            defaultValue="Expert Directory" 
            as="h1" 
            className="text-3xl md:text-4xl font-bold mb-4" 
          />
          <EditableText 
            contentKey="experts_directory_subtitle" 
            defaultValue="Connect with fellow experts, share knowledge, and expand your professional network" 
            as="p" 
            className="text-muted-foreground max-w-2xl mx-auto" 
          />
        </div>

        {/* Verification Warning */}
        {!currentUserVerified && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account is pending verification. You can browse the directory but cannot connect with other experts until your account is verified.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, institution, expertise, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          {filteredExperts.length} expert{filteredExperts.length !== 1 ? 's' : ''} found
        </p>

        {/* Experts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <Card key={expert.id} className="hover:border-accent/50 transition-all hover:shadow-lg relative">
              {/* Admin-only test account label */}
              {isAdmin && expert.is_test_account && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="text-xs italic text-muted-foreground bg-background/80 px-2 py-1 rounded">Visible only to admins</span>
                </div>
              )}
              {/* Admin delete button */}
              {isAdmin && (
                <button
                  onClick={() => handleAdminDelete(expert.id)}
                  disabled={deletingId === expert.id}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  title="Delete user (Admin)"
                >
                  {deletingId === expert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              )}
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={expert.profile_image_url || undefined} />
                    <AvatarFallback className="bg-accent/10 text-accent font-medium">
                      {getInitials(expert.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link to={`/expert/${expert.id}`} className="font-semibold text-lg truncate hover:text-accent transition-colors hover:underline block">
                      <EditableProfileField
                        userId={expert.id}
                        field="full_name"
                        value={expert.full_name}
                        className="font-semibold text-lg"
                      />
                    </Link>
                    {expert.institution && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        <EditableProfileField
                          userId={expert.id}
                          field="institution"
                          value={expert.institution}
                          className="text-sm text-muted-foreground"
                        />
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  {expert.education_level && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{getEducationLabel(expert.education_level)}</span>
                      {expert.years_of_experience && (
                        <span>• {expert.years_of_experience} years exp.</span>
                      )}
                    </div>
                  )}
                  
                  {expert.field_of_expertise && expert.field_of_expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {expert.field_of_expertise.slice(0, 3).map((field, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                      {expert.field_of_expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{expert.field_of_expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                </div>

                {/* Connection Button */}
                <div className="pt-3 border-t border-border">
                  {connectionStatuses[expert.id] === 'accepted' ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </Button>
                  ) : connectionStatuses[expert.id] === 'pending_sent' ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Clock className="w-4 h-4 mr-2" />
                      Request Pending
                    </Button>
                  ) : connectionStatuses[expert.id] === 'pending_received' ? (
                    <Button className="w-full" onClick={() => acceptConnection(expert.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Accept Request
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => sendConnectionRequest(expert.id)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExperts.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">No experts found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ExpertsDirectory;
