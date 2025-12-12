import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Search, Calendar, Shield, Star, Users, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

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
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Connecting Researchers with <span className="text-accent">Experts</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find and interview verified experts for your research projects. Ethical, efficient, and professional — bridging the gap between knowledge seekers and knowledge holders.
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
                Browse Experts
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ExpertGate?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We make connecting with experts simple, ethical, and effective
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-muted-foreground">
                Filter by field, institution, availability, and location to find the perfect expert for your research.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-muted-foreground">
                Request interviews directly through the platform. Experts can accept, reschedule, or refer you to colleagues.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ethical & Transparent</h3>
              <p className="text-muted-foreground">
                Built with research integrity in mind. Fair and transparent platform for knowledge exchange.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up as a researcher or expert. Complete your profile to get started.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Find Your Expert</h3>
              <p className="text-muted-foreground">
                Search and filter through verified experts by field, institution, and availability.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Submit Your Request</h3>
              <p className="text-muted-foreground">
                Share your research topic, interview questions, and preferred duration to connect with your expert.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
              4
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Conduct Your Interview</h3>
              <p className="text-muted-foreground">
                Once confirmed, chat with the expert and schedule your interview — online or offline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold text-accent mb-2">500+</div>
            <div className="text-muted-foreground">Verified Experts</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">1,200+</div>
            <div className="text-muted-foreground">Interviews Completed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">50+</div>
            <div className="text-muted-foreground">Research Fields</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">98%</div>
            <div className="text-muted-foreground">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* CTA Section - Hidden when logged in */}
      {showGuestContent && (
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center bg-accent/5 rounded-2xl p-12 border border-accent/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Join researchers connecting with verified experts today
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
