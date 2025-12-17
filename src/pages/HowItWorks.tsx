import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  UserPlus, 
  Search, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Star,
  ArrowRight,
  Users,
  Shield,
  Clock
} from "lucide-react";

const HowItWorks = () => {
  const researcherSteps = [
    {
      icon: UserPlus,
      title: "1. Create Your Account",
      description: "Sign up as a researcher with your institutional email. Tell us about your research interests and institution."
    },
    {
      icon: Search,
      title: "2. Find Experts",
      description: "Browse our directory of verified experts. Filter by field of expertise, experience, and availability."
    },
    {
      icon: MessageSquare,
      title: "3. Connect & Message",
      description: "Send connection requests to experts you'd like to interview. Use our messaging system to discuss your research."
    },
    {
      icon: Calendar,
      title: "4. Request Interviews",
      description: "Submit detailed interview requests with your questions and preferred times. Experts can accept and schedule."
    },
    {
      icon: CheckCircle,
      title: "5. Conduct Interviews",
      description: "Meet with experts at scheduled times. Our platform helps you stay organized with interview history."
    },
    {
      icon: Star,
      title: "6. Rate & Review",
      description: "After interviews, provide feedback to help maintain quality and recognize helpful experts."
    }
  ];

  const expertSteps = [
    {
      icon: UserPlus,
      title: "1. Sign Up as Expert",
      description: "Create your expert profile with your credentials, expertise areas, and professional background."
    },
    {
      icon: Shield,
      title: "2. Get Verified",
      description: "Submit your credentials for verification. Our team reviews your qualifications to ensure quality."
    },
    {
      icon: Clock,
      title: "3. Set Availability",
      description: "Configure your monthly interview limits and availability status. Control when you're open to requests."
    },
    {
      icon: MessageSquare,
      title: "4. Receive Requests",
      description: "Researchers will send connection and interview requests. Review them and decide which to accept."
    },
    {
      icon: Calendar,
      title: "5. Schedule & Meet",
      description: "Accept interview requests and schedule meetings. Help researchers with your valuable expertise."
    },
    {
      icon: Users,
      title: "6. Build Your Network",
      description: "Connect with researchers and other experts. Expand your professional network in your field."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">How ExpertGate Works</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connecting researchers with verified experts has never been easier. 
              Follow these simple steps to get started.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="border-2 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verified Experts</h3>
                <p className="text-sm text-muted-foreground">
                  All experts undergo credential verification before joining the platform
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Interview Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly limits protect experts from fatigue while ensuring availability
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Free to Use</h3>
                <p className="text-sm text-muted-foreground">
                  ExpertGate is completely free for both researchers and experts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* For Researchers */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold">For Researchers</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {researcherSteps.map((step, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <step.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* For Experts */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <h2 className="text-3xl font-bold">For Experts</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {expertSteps.map((step, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <step.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="text-center bg-muted/50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join our growing community of researchers and experts. 
              Sign up today and start making meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/auth">
                  Create Account
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/find-experts">
                  Browse Experts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HowItWorks;
