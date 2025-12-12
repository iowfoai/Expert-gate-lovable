import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InterviewRequestDialog from "@/components/InterviewRequestDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Star, Users, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserTypeGuard } from "@/hooks/useUserTypeGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string;
  bio: string | null;
  institution: string | null;
  field_of_expertise: string[] | null;
  education_level: string | null;
  years_of_experience: number | null;
  profile_image_url: string | null;
  is_available: boolean | null;
  interviews_remaining: number | null;
  monthly_interview_limit: number | null;
}

interface InterviewRequest {
  id: string;
  researcher_id: string;
  research_topic: string;
  description: string;
  questions: string[];
  preferred_date: string | null;
  duration_minutes: number;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  researcher_rating: number | null;
  researcher_feedback: string | null;
  created_at: string;
  researcher?: {
    full_name: string;
    research_institution: string | null;
  };
}

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading: authLoading, userId } = useUserTypeGuard(['expert']);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<InterviewRequest[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewRequest[]>([]);
  const [pastInterviews, setPastInterviews] = useState<InterviewRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !userId) return;
    
    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
        setIsAvailable(profileData.is_available ?? true);
      }

      // Fetch all interview requests for this expert
      const { data: requests } = await supabase
        .from('interview_requests')
        .select('*')
        .eq('expert_id', userId)
        .order('created_at', { ascending: false });

      if (requests) {
        // Get researcher info for each request
        const researcherIds = [...new Set(requests.map(r => r.researcher_id))];
        const { data: researchers } = await supabase
          .from('profiles')
          .select('id, full_name, research_institution')
          .in('id', researcherIds);

        const requestsWithResearchers = requests.map(req => ({
          ...req,
          researcher: researchers?.find(r => r.id === req.researcher_id)
        }));

        // Categorize requests
        setPendingRequests(requestsWithResearchers.filter(r => r.status === 'pending'));
        setUpcomingInterviews(requestsWithResearchers.filter(r => r.status === 'accepted' && !r.completed_at));
        setPastInterviews(requestsWithResearchers.filter(r => r.status === 'completed' || r.completed_at));
      }

      setLoading(false);
    };

    fetchData();
  }, [authLoading, userId]);

  const handleAvailabilityChange = async (available: boolean) => {
    setIsAvailable(available);
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: available })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive"
      });
      setIsAvailable(!available);
    } else {
      toast({
        title: available ? "You're now available" : "You're now unavailable",
        description: available 
          ? "Researchers can send you interview requests" 
          : "You won't receive new interview requests"
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    // Update interview request status
    const { error } = await supabase
      .from('interview_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive"
      });
      return;
    }

    // Create or find existing connection for chat
    const { data: existingConnection } = await supabase
      .from('expert_connections')
      .select('id')
      .or(`and(requester_id.eq.${userId},recipient_id.eq.${request.researcher_id}),and(requester_id.eq.${request.researcher_id},recipient_id.eq.${userId})`)
      .maybeSingle();

    if (!existingConnection) {
      // Create a new connection for this interview chat
      await supabase
        .from('expert_connections')
        .insert({
          requester_id: request.researcher_id,
          recipient_id: userId,
          status: 'accepted'
        });
    } else if (existingConnection) {
      // Update to accepted if it exists but isn't accepted
      await supabase
        .from('expert_connections')
        .update({ status: 'accepted' })
        .eq('id', existingConnection.id);
    }

    // Send email notification to researcher
    supabase.functions.invoke('send-interview-notification', {
      body: { type: 'request_accepted', interviewRequestId: requestId }
    }).catch(err => console.error('Failed to send notification:', err));

    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setUpcomingInterviews(prev => [...prev, { ...request, status: 'accepted' }]);
    
    toast({
      title: "Request Accepted",
      description: "The researcher will be notified"
    });
  };

  const handleDeclineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('interview_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive"
      });
    } else {
      // Send email notification to researcher
      supabase.functions.invoke('send-interview-notification', {
        body: { type: 'request_declined', interviewRequestId: requestId }
      }).catch(err => console.error('Failed to send notification:', err));

      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      toast({
        title: "Request Declined",
        description: "The researcher will be notified"
      });
    }
  };

  const handleViewDetails = (request: InterviewRequest) => {
    setSelectedRequest({
      researcherName: request.researcher?.full_name || 'Unknown',
      researchTopic: request.research_topic,
      description: request.description,
      questions: request.questions,
      requestedDate: request.preferred_date,
      duration: `${request.duration_minutes} minutes`
    });
    setDetailsDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    return level ? labels[level] || level : '';
  };

  const totalInterviews = pastInterviews.length;

  if (authLoading || loading) {
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Profile not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/expert-home")}
            className="mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-4xl font-bold mb-2">Expert Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your interview requests and availability
          </p>
        </div>

        {/* Profile Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.profile_image_url || undefined} />
                <AvatarFallback className="bg-accent/10 text-accent font-semibold text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-1">{profile.full_name}</h3>
                {profile.education_level && (
                  <p className="text-muted-foreground mb-1">{getEducationLabel(profile.education_level)}</p>
                )}
                {profile.institution && (
                  <p className="text-sm text-muted-foreground mb-3">{profile.institution}</p>
                )}
                {profile.field_of_expertise && profile.field_of_expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.field_of_expertise.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Switch 
                    id="availability" 
                    checked={isAvailable}
                    onCheckedChange={handleAvailabilityChange}
                  />
                  <Label htmlFor="availability" className="cursor-pointer">
                    {isAvailable ? "Available for interviews" : "Not available"}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalInterviews}</div>
                  <div className="text-sm text-muted-foreground">Total Interviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{profile.interviews_remaining ?? 5}</div>
                  <div className="text-sm text-muted-foreground">Remaining This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingRequests.length}</div>
                  <div className="text-sm text-muted-foreground">Pending Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{upcomingInterviews.length}</div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="requests" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="requests">
              Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming {upcomingInterviews.length > 0 && `(${upcomingInterviews.length})`}
            </TabsTrigger>
            <TabsTrigger value="past">Past Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No pending requests at the moment
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <h3 className="font-semibold text-lg mb-1">
                            {request.researcher?.full_name || 'Unknown Researcher'}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Research Topic: {request.research_topic}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {request.preferred_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(request.preferred_date).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {request.duration_minutes} minutes
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(request)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            See Details
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No upcoming interviews scheduled
                  </CardContent>
                </Card>
              ) : (
                upcomingInterviews.map((interview) => (
                  <Card key={interview.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <h3 className="font-semibold text-lg mb-1">
                            {interview.researcher?.full_name || 'Unknown Researcher'}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Research Topic: {interview.research_topic}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {interview.preferred_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(interview.preferred_date).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration_minutes} minutes
                            </div>
                          </div>
                          <Badge variant="secondary" className="mt-2">
                            Confirmed
                          </Badge>
                        </div>
                        <Button 
                          onClick={async () => {
                            // Find the connection for this researcher
                            const { data: connection } = await supabase
                              .from('expert_connections')
                              .select('id')
                              .or(`and(requester_id.eq.${userId},recipient_id.eq.${interview.researcher_id}),and(requester_id.eq.${interview.researcher_id},recipient_id.eq.${userId})`)
                              .eq('status', 'accepted')
                              .maybeSingle();
                            
                            if (connection) {
                              navigate(`/connections?chat=${connection.id}`);
                            } else {
                              toast({
                                title: "Error",
                                description: "Connection not found. Please try accepting the request again.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Chat with Researcher
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="space-y-4">
              {pastInterviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No past interviews yet
                  </CardContent>
                </Card>
              ) : (
                pastInterviews.map((interview) => (
                  <Card key={interview.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <h3 className="font-semibold text-lg mb-1">
                            {interview.researcher?.full_name || 'Unknown Researcher'}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Research Topic: {interview.research_topic}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {interview.completed_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(interview.completed_at).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration_minutes} minutes
                            </div>
                            {interview.researcher_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-gold text-gold" />
                                {interview.researcher_rating}
                              </div>
                            )}
                          </div>
                          {interview.researcher_feedback && (
                            <p className="mt-2 text-sm italic text-muted-foreground">
                              "{interview.researcher_feedback}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Interview Details Dialog */}
      {selectedRequest && (
        <InterviewRequestDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          request={selectedRequest}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default ExpertDashboard;
