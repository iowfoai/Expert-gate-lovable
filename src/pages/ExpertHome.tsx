import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Users, Clock, MessageSquare, Bell, CheckCircle, AlertTriangle, ShieldCheck, LayoutDashboard } from "lucide-react";

interface PendingRequest {
  id: string;
  requester: {
    full_name: string;
    field_of_expertise: string[] | null;
    institution: string | null;
  };
  created_at: string;
}

const ExpertHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [interviewRequests, setInterviewRequests] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileData?.user_type !== 'expert') {
        navigate('/');
        return;
      }

      setProfile(profileData);

      // Only fetch connection requests and interview requests if verified
      if (profileData?.verification_status === 'verified') {
        // Fetch pending connection requests
        const { data: connectionRequests } = await supabase
          .from('expert_connections')
          .select(`
            id,
            created_at,
            requester_id
          `)
          .eq('recipient_id', session.user.id)
          .eq('status', 'pending');

        if (connectionRequests && connectionRequests.length > 0) {
          // Fetch requester profiles
          const requesterIds = connectionRequests.map(r => r.requester_id);
          const { data: requesterProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, field_of_expertise, institution')
            .in('id', requesterIds);

          const requestsWithProfiles = connectionRequests.map(req => ({
            id: req.id,
            created_at: req.created_at,
            requester: requesterProfiles?.find(p => p.id === req.requester_id) || {
              full_name: 'Unknown',
              field_of_expertise: null,
              institution: null
            }
          }));

          setPendingRequests(requestsWithProfiles);
        }

        // Fetch interview request count
        const { count } = await supabase
          .from('interview_requests')
          .select('*', { count: 'exact', head: true })
          .eq('expert_id', session.user.id)
          .eq('status', 'pending');

        setInterviewRequests(count || 0);
      }
      
      setLoading(false);
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleConnectionResponse = async (connectionId: string, accept: boolean) => {
    const { error } = await supabase
      .from('expert_connections')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', connectionId);

    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.id !== connectionId));
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

  // Show pending verification state
  if (profile?.verification_status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/10 mb-8">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Verification Pending</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Thank you for registering as an expert! Your profile is currently being reviewed by an admin.
            </p>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-2">What Happens Next?</h3>
                    <ul className="text-muted-foreground space-y-2">
                      <li>• An admin will review your credentials and expertise</li>
                      <li>• Verification typically takes 1-3 business days</li>
                      <li>• You'll receive an email once your account is verified</li>
                      <li>• Until then, you can browse the website but won't appear in expert directories</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-8 flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/profile')}>
                View Profile
              </Button>
              <Button variant="outline" onClick={() => navigate('/about')}>
                Learn More
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show rejected state
  if (profile?.verification_status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-8">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Verification Not Approved</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Unfortunately, your expert verification was not approved at this time.
            </p>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-6">
                <p className="text-muted-foreground">
                  If you believe this was an error, please contact our support team for assistance.
                </p>
              </CardContent>
            </Card>
            <div className="mt-8">
              <Button onClick={() => navigate('/support')}>
                Contact Support
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Pending Requests Alert */}
        {interviewRequests > 0 && (
          <div className="mb-8 p-6 bg-accent/10 border border-accent/30 rounded-xl animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/20 animate-pulse">
                  <Bell className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-accent">
                    You have {interviewRequests} interview request{interviewRequests !== 1 ? 's' : ''} pending!
                  </h3>
                  <p className="text-muted-foreground">Researchers are waiting to hear from you</p>
                </div>
              </div>
              <Button onClick={() => navigate('/expert-dashboard')} className="gap-2">
                <MessageSquare className="w-4 h-4" />
                View Requests
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Button */}
        <div className="flex justify-center mb-12">
          <Button 
            onClick={() => navigate('/expert-dashboard')} 
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-lg font-semibold gap-3"
          >
            <LayoutDashboard className="w-5 h-5" />
            Go to Dashboard
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          {interviewRequests > 0 ? (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-accent">
                Great news!
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground/80 mb-6">
                Researchers want to interview you
              </h2>
            </>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                All done!
              </h1>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-accent mb-6">
                Now wait for researchers to contact you
              </h2>
            </>
          )}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your expert profile is live. Researchers can now find you and request interviews.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-accent/10">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{interviewRequests}</p>
                <p className="text-muted-foreground">Pending Interview Requests</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-muted-foreground">Connection Requests</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Meanwhile Section */}
        <div className="text-center mb-8">
          <p className="text-xl italic text-muted-foreground mb-2">Now in the meanwhile...</p>
          <h3 className="text-2xl md:text-3xl font-semibold mb-6">Connect with other experts</h3>
          <Link to="/experts-directory">
            <Button size="lg" className="gap-2">
              <Users className="w-5 h-5" />
              Browse Expert Directory
            </Button>
          </Link>
        </div>

        {/* Pending Connection Requests */}
        {pendingRequests.length > 0 && (
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Pending Connection Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                >
                  <div>
                    <p className="font-medium">{request.requester.full_name}</p>
                    <div className="flex gap-2 mt-1">
                      {request.requester.institution && (
                        <span className="text-sm text-muted-foreground">
                          {request.requester.institution}
                        </span>
                      )}
                      {request.requester.field_of_expertise?.slice(0, 2).map((field, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConnectionResponse(request.id, false)}
                    >
                      Decline
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleConnectionResponse(request.id, true)}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/expert-dashboard')}>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">View Dashboard</h4>
              <p className="text-muted-foreground text-sm">
                Manage your interview requests and see your schedule
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2">Edit Profile</h4>
              <p className="text-muted-foreground text-sm">
                Update your expertise, bio, and availability
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExpertHome;
