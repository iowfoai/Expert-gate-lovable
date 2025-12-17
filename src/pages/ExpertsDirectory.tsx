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
import { useUserTypeGuard } from "@/hooks/useUserTypeGuard";
import { Search, UserPlus, Check, Clock, Users, GraduationCap, Building2 } from "lucide-react";

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
}

interface ConnectionStatus {
  [expertId: string]: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
}

const ExpertsDirectory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading: authLoading, userId: currentUserId } = useUserTypeGuard(['expert']);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserVerified, setCurrentUserVerified] = useState(false);

  useEffect(() => {
    if (authLoading || !currentUserId) return;
    
    const fetchData = async () => {

      // Fetch all verified experts except current user
      const { data: expertsData, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, institution, field_of_expertise, education_level, years_of_experience, profile_image_url, country, verification_status')
        .eq('user_type', 'expert')
        .eq('verification_status', 'verified')
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

    const { error } = await supabase
      .from('expert_connections')
      .insert({
        requester_id: currentUserId,
        recipient_id: expertId,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive"
      });
      return;
    }

    setConnectionStatuses(prev => ({
      ...prev,
      [expertId]: 'pending_sent'
    }));

    toast({
      title: "Request Sent",
      description: "Connection request sent successfully!"
    });
  };

  const acceptConnection = async (expertId: string) => {
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

    setConnectionStatuses(prev => ({
      ...prev,
      [expertId]: 'accepted'
    }));

    toast({
      title: "Connected!",
      description: "You are now connected with this expert"
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Expert Directory</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow experts, share knowledge, and expand your professional network
          </p>
        </div>

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
            <Card key={expert.id} className="hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={expert.profile_image_url || undefined} />
                    <AvatarFallback className="bg-accent/10 text-accent font-medium">
                      {getInitials(expert.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{expert.full_name}</h3>
                    {expert.institution && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {expert.institution}
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

                  {expert.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {expert.bio}
                    </p>
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
