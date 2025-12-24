import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Search, Calendar, Shield, Users, MessageSquare, Handshake, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditableText } from "@/components/EditableText";
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const { pendingCount } = usePendingRequests();
  const { unreadConnectionIds } = useUnreadMessages();
  
  const hasNotification = pendingCount > 0 || unreadConnectionIds.size > 0;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
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
            <EditableText 
              contentKey="index.hero.badge" 
              defaultValue="A Two-Way Street" 
              className="text-sm font-medium"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <EditableText 
              contentKey="index.hero.title.part1" 
              defaultValue="Bridging" 
            />{" "}
            <span className="text-accent">
              <EditableText contentKey="index.hero.title.part2" defaultValue="Researchers" />
            </span>{" "}
            <EditableText contentKey="index.hero.title.part3" defaultValue="&" />{" "}
            <span className="text-accent">
              <EditableText contentKey="index.hero.title.part4" defaultValue="Experts" />
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            <EditableText 
              contentKey="index.hero.description" 
              defaultValue="Book interviews with verified experts, collaborate on research projects, build lasting connections, and exchange knowledge — all in one ethical, professional platform."
              multiline
            />
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showGuestContent && (
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto">
                  <EditableText contentKey="index.hero.cta.getstarted" defaultValue="Get Started" />
                </Button>
              </Link>
            )}
            {isLoggedIn && (
              <Link to="/connections">
                <Button size="lg" className="w-full sm:w-auto relative">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chats
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
                  )}
                </Button>
              </Link>
            )}
            <Link to="/find-experts">
              <Button size="lg" variant={isLoggedIn ? "outline" : "outline"} className="w-full sm:w-auto">
                <EditableText contentKey="index.hero.cta.interview" defaultValue="Interview Experts" />
              </Button>
            </Link>
            <Link to="/research-collab">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <EditableText contentKey="index.hero.cta.collab" defaultValue="Research Collaboration" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <EditableText contentKey="index.features.title" defaultValue="Everything You Need to Connect" />
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            <EditableText 
              contentKey="index.features.subtitle" 
              defaultValue="Whether you're seeking expertise or sharing knowledge, ExpertGate has you covered"
            />
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <EditableText contentKey="index.features.card1.title" defaultValue="Expert Interviews" />
              </h3>
              <p className="text-muted-foreground">
                <EditableText 
                  contentKey="index.features.card1.desc" 
                  defaultValue="Request and conduct interviews with verified experts for your research projects."
                />
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <EditableText contentKey="index.features.card2.title" defaultValue="Research Collaboration" />
              </h3>
              <p className="text-muted-foreground">
                <EditableText 
                  contentKey="index.features.card2.desc" 
                  defaultValue="Post collaboration opportunities and find researchers to partner with on projects."
                />
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <EditableText contentKey="index.features.card3.title" defaultValue="Expert Connections" />
              </h3>
              <p className="text-muted-foreground">
                <EditableText 
                  contentKey="index.features.card3.desc" 
                  defaultValue="Build your network by connecting with experts and peers in your field."
                />
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                <EditableText contentKey="index.features.card4.title" defaultValue="Ethical & Verified" />
              </h3>
              <p className="text-muted-foreground">
                <EditableText 
                  contentKey="index.features.card4.desc" 
                  defaultValue="All experts are verified. Built with research integrity and ethics in mind."
                />
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works - Two Columns */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <EditableText contentKey="index.howitworks.title" defaultValue="How It Works" />
          </h2>
          <p className="text-muted-foreground">
            <EditableText contentKey="index.howitworks.subtitle" defaultValue="A platform designed for both researchers and experts" />
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* For Researchers */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8 text-accent">
              <EditableText contentKey="index.howitworks.researchers.title" defaultValue="For Researchers" />
            </h3>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  <EditableText contentKey="index.howitworks.researchers.step1.title" defaultValue="Create Your Profile" />
                </h4>
                <p className="text-muted-foreground text-sm">
                  <EditableText 
                    contentKey="index.howitworks.researchers.step1.desc" 
                    defaultValue="Sign up and tell us about your research interests and institution."
                  />
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  <EditableText contentKey="index.howitworks.researchers.step2.title" defaultValue="Find & Interview Experts" />
                </h4>
                <p className="text-muted-foreground text-sm">
                  <EditableText 
                    contentKey="index.howitworks.researchers.step2.desc" 
                    defaultValue="Browse verified experts and request interviews for your research."
                  />
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  <EditableText contentKey="index.howitworks.researchers.step3.title" defaultValue="Post Collaboration Projects" />
                </h4>
                <p className="text-muted-foreground text-sm">
                  <EditableText 
                    contentKey="index.howitworks.researchers.step3.desc" 
                    defaultValue="Looking for collaborators? Post your project and receive applications."
                  />
                </p>
              </div>
            </div>
          </div>
          
          {/* For Experts */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-center mb-8 text-accent">
              <EditableText contentKey="index.howitworks.experts.title" defaultValue="For Experts" />
            </h3>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  <EditableText contentKey="index.howitworks.experts.step1.title" defaultValue="Get Verified" />
                </h4>
                <p className="text-muted-foreground text-sm">
                  <EditableText 
                    contentKey="index.howitworks.experts.step1.desc" 
                    defaultValue="Sign up, upload credentials, and get verified by our team."
                  />
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  <EditableText contentKey="index.howitworks.experts.step2.title" defaultValue="Receive Interview Requests" />
                </h4>
                <p className="text-muted-foreground text-sm">
                  <EditableText 
                    contentKey="index.howitworks.experts.step2.desc" 
                    defaultValue="Researchers will find you and request interviews based on your expertise."
                  />
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-1">
                  <EditableText contentKey="index.howitworks.experts.step3.title" defaultValue="Connect with Peers" />
                </h4>
                <p className="text-muted-foreground text-sm">
                  <EditableText 
                    contentKey="index.howitworks.experts.step3.desc" 
                    defaultValue="Browse and connect with other experts in your field to expand your network."
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section - Hidden when logged in */}
      {showGuestContent && (
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center bg-accent/5 rounded-2xl p-12 border border-accent/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <EditableText contentKey="index.cta.title" defaultValue="Join the Knowledge Exchange" />
            </h2>
            <p className="text-muted-foreground mb-8">
              <EditableText 
                contentKey="index.cta.description" 
                defaultValue="Whether you're seeking expertise or sharing knowledge, ExpertGate brings researchers and experts together"
              />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup&type=researcher">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <EditableText contentKey="index.cta.researcher" defaultValue="Join as Researcher" />
                </Button>
              </Link>
              <Link to="/auth?mode=signup&type=expert">
                <Button size="lg" className="w-full sm:w-auto">
                  <EditableText contentKey="index.cta.expert" defaultValue="Join as Expert" />
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
