import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Search, Calendar, Shield, Users, MessageSquare, Handshake, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  verifiedExperts: number;
  completedInterviews: number;
  researchFields: number;
  totalResearchers: number;
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats>({
    verifiedExperts: 0,
    completedInterviews: 0,
    researchFields: 0,
    totalResearchers: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch verified experts count
      const { count: expertsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'expert')
        .eq('verification_status', 'verified');

      // Fetch completed interviews count
      const { count: interviewsCount } = await supabase
        .from('interview_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Fetch unique research fields from experts
      const { data: expertsWithFields } = await supabase
        .from('profiles')
        .select('field_of_expertise')
        .eq('user_type', 'expert')
        .not('field_of_expertise', 'is', null);

      const uniqueFields = new Set<string>();
      expertsWithFields?.forEach(expert => {
        expert.field_of_expertise?.forEach((field: string) => uniqueFields.add(field));
      });

      // Fetch researchers count
      const { count: researchersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'researcher');

      setStats({
        verifiedExperts: expertsCount || 0,
        completedInterviews: interviewsCount || 0,
        researchFields: uniqueFields.size,
        totalResearchers: researchersCount || 0,
      });
    };

    fetchStats();
  }, []);

  // Show nothing for auth-dependent sections until we know auth state
  const showGuestContent = isLoggedIn === false;
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6">
            <ArrowLeftRight className="w-4 h-4" />
            <span className="text-sm font-medium">A Two-Way Street</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Bridging <span className="text-accent">Researchers</span> & <span className="text-accent">Experts</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book interviews with verified experts, collaborate on research projects, build lasting connections, and exchange knowledge — all in one ethical, professional platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showGuestContent && (
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
            )}
            <Link to="/find-experts">
              <Button size="lg" variant={isLoggedIn ? "default" : "outline"} className="w-full sm:w-auto">
                Interview Experts
              </Button>
            </Link>
            <Link to="/research-collab">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Research Collaboration
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Connect</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're seeking expertise or sharing knowledge, ExpertGate has you covered
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Interviews</h3>
              <p className="text-muted-foreground">
                Request and conduct interviews with verified experts for your research projects.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Research Collaboration</h3>
              <p className="text-muted-foreground">
                Post collaboration opportunities and find researchers to partner with on projects.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Connections</h3>
              <p className="text-muted-foreground">
                Build your network by connecting with experts and peers in your field.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ethical & Verified</h3>
              <p className="text-muted-foreground">
                All experts are verified. Built with research integrity and ethics in mind.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works - Two Columns */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground">A platform designed for both researchers and experts</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* For Researchers */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8 text-accent">For Researchers</h3>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Create Your Profile</h4>
                <p className="text-muted-foreground text-sm">
                  Sign up and tell us about your research interests and institution.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Find & Interview Experts</h4>
                <p className="text-muted-foreground text-sm">
                  Browse verified experts and request interviews for your research.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Post Collaboration Projects</h4>
                <p className="text-muted-foreground text-sm">
                  Looking for collaborators? Post your project and receive applications.
                </p>
              </div>
            </div>
          </div>
          
          {/* For Experts */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8 text-accent">For Experts</h3>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Get Verified</h4>
                <p className="text-muted-foreground text-sm">
                  Sign up, upload credentials, and get verified by our team.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Receive Interview Requests</h4>
                <p className="text-muted-foreground text-sm">
                  Researchers will find you and request interviews based on your expertise.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">Connect with Peers</h4>
                <p className="text-muted-foreground text-sm">
                  Browse and connect with other experts in your field to expand your network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-accent mb-2">{stats.verifiedExperts}</div>
            <div className="text-muted-foreground">Verified Experts</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">{stats.completedInterviews}</div>
            <div className="text-muted-foreground">Interviews Completed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">{stats.researchFields}</div>
            <div className="text-muted-foreground">Research Fields</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">{stats.totalResearchers}</div>
            <div className="text-muted-foreground">Researchers</div>
          </div>
        </div>
      </section>

      {/* CTA Section - Hidden when logged in */}
      {showGuestContent && (
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center bg-accent/5 rounded-2xl p-12 border border-accent/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Knowledge Exchange</h2>
            <p className="text-muted-foreground mb-8">
              Whether you're seeking expertise or sharing knowledge, ExpertGate brings researchers and experts together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup&type=researcher">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Join as Researcher
                </Button>
              </Link>
              <Link to="/auth?mode=signup&type=expert">
                <Button size="lg" className="w-full sm:w-auto">
                  Join as Expert
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
