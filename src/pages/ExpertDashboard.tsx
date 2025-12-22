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
import { Calendar as CalendarIcon, Star, Users, Clock, CheckCircle, XCircle, FileText, MessageCircle, Trash2, AlertTriangle, Handshake, UserMinus, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import { useUserTypeGuard } from "@/hooks/useUserTypeGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface CollabPost {
  id: string;
  title: string;
  description: string;
  field_of_study: string[];
  status: string;
  created_at: string;
  group?: {
    id: string;
    name: string;
    members: {
      id: string;
      user_id: string;
      role: string;
      user: {
        full_name: string;
        profile_image_url: string | null;
      };
    }[];
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
  const [missedInterviews, setMissedInterviews] = useState<InterviewRequest[]>([]);
  const [myCollabs, setMyCollabs] = useState<CollabPost[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endCollabDialogOpen, setEndCollabDialogOpen] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<CollabPost | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [kickMemberDialogOpen, setKickMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);

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
        const now = new Date();
        setPendingRequests(requestsWithResearchers.filter(r => r.status === 'pending'));
        
        // Upcoming: accepted, not completed, and preferred_date is in the future or no date set
        setUpcomingInterviews(requestsWithResearchers.filter(r => {
          if (r.status !== 'accepted' || r.completed_at) return false;
          if (!r.preferred_date) return true; // No date set, still upcoming
          return new Date(r.preferred_date) >= now;
        }));
        
        // Missed: accepted, not completed, and preferred_date is in the past
        setMissedInterviews(requestsWithResearchers.filter(r => {
          if (r.status !== 'accepted' || r.completed_at) return false;
          if (!r.preferred_date) return false;
          return new Date(r.preferred_date) < now;
        }));
        
        setPastInterviews(requestsWithResearchers.filter(r => r.status === 'completed' || r.completed_at));
      }

      // Fetch collaboration posts authored by this user
      const { data: collabPosts } = await supabase
        .from('collaboration_posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (collabPosts && collabPosts.length > 0) {
        // Fetch groups for these posts
        const postIds = collabPosts.map(p => p.id);
        const { data: groups } = await supabase
          .from('project_groups')
          .select('id, name, post_id')
          .in('post_id', postIds);

        // Fetch members for these groups
        let membersMap: Record<string, any[]> = {};
        if (groups && groups.length > 0) {
          const groupIds = groups.map(g => g.id);
          const { data: members } = await supabase
            .from('project_group_members')
            .select('id, user_id, role, group_id')
            .in('group_id', groupIds);

          if (members && members.length > 0) {
            const memberUserIds = members.map(m => m.user_id);
            const { data: memberProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, profile_image_url')
              .in('id', memberUserIds);

            members.forEach(member => {
              const profile = memberProfiles?.find(p => p.id === member.user_id);
              if (!membersMap[member.group_id]) membersMap[member.group_id] = [];
              membersMap[member.group_id].push({
                ...member,
                user: profile || { full_name: 'Unknown', profile_image_url: null }
              });
            });
          }
        }

        const collabsWithGroups = collabPosts.map(post => {
          const group = groups?.find(g => g.post_id === post.id);
          return {
            ...post,
            group: group ? {
              id: group.id,
              name: group.name,
              members: membersMap[group.id] || []
            } : undefined
          };
        });

        setMyCollabs(collabsWithGroups);
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
          status: 'accepted',
          connection_type: 'interview'
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

  const handleMarkCompleted = async (requestId: string) => {
    const interview = upcomingInterviews.find(i => i.id === requestId);
    if (!interview) return;

    const { error } = await supabase
      .from('interview_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark interview as completed",
        variant: "destructive"
      });
      return;
    }

    setUpcomingInterviews(prev => prev.filter(i => i.id !== requestId));
    setPastInterviews(prev => [...prev, { ...interview, status: 'completed', completed_at: new Date().toISOString() }]);
    
    toast({
      title: "Interview Completed",
      description: "The interview has been marked as completed"
    });
  };

  const handleDeleteMissed = async (requestId: string) => {
    const { error } = await supabase
      .from('interview_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete missed interview",
        variant: "destructive"
      });
      return;
    }

    setMissedInterviews(prev => prev.filter(i => i.id !== requestId));
    
    toast({
      title: "Interview Removed",
      description: "The missed interview has been removed"
    });
  };

  const handleChatWithResearcher = async (interview: InterviewRequest) => {
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
  };

  const handleEndCollab = async () => {
    if (!selectedCollab) return;

    // Update the collaboration post status to closed
    const { error: postError } = await supabase
      .from('collaboration_posts')
      .update({ status: 'closed' })
      .eq('id', selectedCollab.id);

    if (postError) {
      toast({
        title: "Error",
        description: "Failed to close collaboration",
        variant: "destructive"
      });
      return;
    }

    // Remove all members from the group (except owner)
    if (selectedCollab.group) {
      await supabase
        .from('project_group_members')
        .delete()
        .eq('group_id', selectedCollab.group.id)
        .neq('role', 'owner');
    }

    setMyCollabs(prev => prev.map(c => 
      c.id === selectedCollab.id ? { ...c, status: 'closed' } : c
    ));
    setEndCollabDialogOpen(false);
    setSelectedCollab(null);

    toast({
      title: "Collaboration Ended",
      description: "The collaboration has been closed and members have been removed"
    });
  };

  const handleKickMember = async () => {
    if (!selectedMember || !selectedCollab?.group) return;

    const { error } = await supabase
      .from('project_group_members')
      .delete()
      .eq('id', selectedMember.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
      return;
    }

    // Update local state
    setMyCollabs(prev => prev.map(c => {
      if (c.id === selectedCollab.id && c.group) {
        return {
          ...c,
          group: {
            ...c.group,
            members: c.group.members.filter(m => m.id !== selectedMember.id)
          }
        };
      }
      return c;
    }));

    setKickMemberDialogOpen(false);
    setSelectedMember(null);

    toast({
      title: "Member Removed",
      description: "The member has been removed from the collaboration"
    });
  };

  const openMembersDialog = (collab: CollabPost) => {
    setSelectedCollab(collab);
    setMembersDialogOpen(true);
  };

  const openEndCollabDialog = (collab: CollabPost) => {
    setSelectedCollab(collab);
    setEndCollabDialogOpen(true);
  };

  const openKickMemberDialog = (memberId: string, memberName: string) => {
    setSelectedMember({ id: memberId, name: memberName });
    setKickMemberDialogOpen(true);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  <CalendarIcon className="w-5 h-5 text-accent" />
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

        {/* Calendar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Interview Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={upcomingInterviews
                  .filter(i => i.preferred_date)
                  .map(i => new Date(i.preferred_date!))}
                className="rounded-md border pointer-events-none"
              />
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Upcoming Dates:</p>
                {upcomingInterviews.filter(i => i.preferred_date).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No scheduled interviews</p>
                ) : (
                  upcomingInterviews
                    .filter(i => i.preferred_date)
                    .sort((a, b) => new Date(a.preferred_date!).getTime() - new Date(b.preferred_date!).getTime())
                    .slice(0, 5)
                    .map(interview => (
                      <div key={interview.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span>{new Date(interview.preferred_date!).toLocaleDateString()}</span>
                        <span className="text-muted-foreground truncate">- {interview.researcher?.full_name}</span>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">

        {/* Tabs for different sections */}
        <Tabs defaultValue="requests" className="mb-8">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="requests">
              Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming {upcomingInterviews.length > 0 && `(${upcomingInterviews.length})`}
            </TabsTrigger>
            <TabsTrigger value="missed">
              Missed {missedInterviews.length > 0 && `(${missedInterviews.length})`}
            </TabsTrigger>
            <TabsTrigger value="past">Completed</TabsTrigger>
            <TabsTrigger value="collabs">
              <Handshake className="w-4 h-4 mr-1" />
              Collabs {myCollabs.length > 0 && `(${myCollabs.length})`}
            </TabsTrigger>
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
                                <CalendarIcon className="w-4 h-4" />
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
                                <CalendarIcon className="w-4 h-4" />
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
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => handleChatWithResearcher(interview)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat with Researcher
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleMarkCompleted(interview.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Completed
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="missed">
            <div className="space-y-4">
              {missedInterviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No missed interviews
                  </CardContent>
                </Card>
              ) : (
                missedInterviews.map((interview) => (
                  <Card key={interview.id} className="border-destructive/30">
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
                              <div className="flex items-center gap-1 text-destructive">
                                <AlertTriangle className="w-4 h-4" />
                                Was scheduled for {new Date(interview.preferred_date).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration_minutes} minutes
                            </div>
                          </div>
                          <Badge variant="destructive" className="mt-2">
                            Missed
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => handleChatWithResearcher(interview)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat with Researcher
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleDeleteMissed(interview.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
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
                                <CalendarIcon className="w-4 h-4" />
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

          <TabsContent value="collabs">
            <div className="space-y-4">
              {myCollabs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <Handshake className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>You haven't created any collaboration posts yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/research-collab')}
                    >
                      Browse Collaborations
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myCollabs.map((collab) => (
                  <Card key={collab.id} className={collab.status === 'closed' ? 'opacity-60' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{collab.title}</h3>
                            <Badge variant={collab.status === 'open' ? 'default' : 'secondary'}>
                              {collab.status === 'open' ? 'Active' : 'Closed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {collab.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {collab.field_of_study.slice(0, 3).map((field, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              Created {new Date(collab.created_at).toLocaleDateString()}
                            </div>
                            {collab.group && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {collab.group.members.length} member{collab.group.members.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {collab.group && collab.group.members.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openMembersDialog(collab)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Members
                            </Button>
                          )}
                          {collab.status === 'open' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => openEndCollabDialog(collab)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              End Collab
                            </Button>
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
        </div>
      </div>
      
      {/* Interview Details Dialog */}
      {selectedRequest && (
        <InterviewRequestDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          request={selectedRequest}
        />
      )}

      {/* End Collaboration Confirmation Dialog */}
      <AlertDialog open={endCollabDialogOpen} onOpenChange={setEndCollabDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this collaboration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the collaboration and remove all members from the group chat. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndCollab} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Collaboration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collaboration Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedCollab?.group?.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.user.profile_image_url || undefined} />
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {getInitials(member.user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                {member.role !== 'owner' && selectedCollab?.status === 'open' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openKickMemberDialog(member.id, member.user.full_name)}
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {(!selectedCollab?.group?.members || selectedCollab.group.members.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No members yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Kick Member Confirmation Dialog */}
      <AlertDialog open={kickMemberDialogOpen} onOpenChange={setKickMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.name} from this collaboration? 
              They will no longer have access to the group chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleKickMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
};

export default ExpertDashboard;
