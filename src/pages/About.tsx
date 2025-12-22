import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Users, Shield, MessageSquare, Handshake, Calendar, ArrowLeftRight } from "lucide-react";
import { EditableText } from "@/components/EditableText";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6">
            <ArrowLeftRight className="w-4 h-4" />
            <EditableText 
              contentKey="about.badge" 
              defaultValue="A Two-Way Street" 
              className="text-sm font-medium"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <EditableText contentKey="about.title" defaultValue="About ExpertGate" />
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            <EditableText 
              contentKey="about.subtitle" 
              defaultValue="Bridging Researchers and Experts — Ethically and Effortlessly"
            />
          </p>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-muted-foreground leading-relaxed">
              <EditableText 
                contentKey="about.intro1" 
                defaultValue="ExpertGate was founded on a simple observation: meaningful collaboration for research among researchers and between researchers and experts is an arbitrarily long and inefficient process. Whether you're a student working on a thesis, a journalist investigating a story, a professional researcher conducting a study, or an expert looking to collaborate with peers — finding the right people in due time can be a major challenge."
                multiline
              />
            </p>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              <EditableText 
                contentKey="about.intro2" 
                defaultValue="We built ExpertGate to solve this problem. Our platform creates a two-way street where researchers can book interviews with verified experts, experts can connect with peers in their field, and everyone can collaborate on research projects together. All while maintaining the highest standards of academic integrity and ethical research practices. ExpertGate is completely free to use for both researchers and experts."
                multiline
              />
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2">
              <CardContent className="pt-6">
                <Target className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="about.mission.title" defaultValue="Our Mission" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="about.mission.desc" 
                    defaultValue="To bridge the gap between researchers and experts, enabling meaningful knowledge exchange, collaboration, and professional connections."
                  />
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Heart className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="about.values.title" defaultValue="Our Values" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="about.values.desc" 
                    defaultValue="Integrity, transparency, and mutual respect between researchers and experts guide everything we do on ExpertGate."
                  />
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Users className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="about.community.title" defaultValue="Our Community" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="about.community.desc" 
                    defaultValue="A growing network of verified experts and researchers trust ExpertGate for interviews, collaborations, and professional connections."
                  />
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="about.ethics.title" defaultValue="Our Ethics" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="about.ethics.desc" 
                    defaultValue="We protect against interview fatigue, maintain strict verification standards for all experts, and ensure quality interactions."
                  />
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/30 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">
              <EditableText contentKey="about.features.title" defaultValue="Platform Features" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center">
                <Calendar className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-semibold mb-2">
                  <EditableText contentKey="about.features.interviews.title" defaultValue="Expert Interviews" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <EditableText 
                    contentKey="about.features.interviews.desc" 
                    defaultValue="Researchers can book interviews with verified experts for their research projects."
                  />
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Handshake className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-semibold mb-2">
                  <EditableText contentKey="about.features.collab.title" defaultValue="Research Collaboration" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <EditableText 
                    contentKey="about.features.collab.desc" 
                    defaultValue="Post collaboration opportunities and find partners for research projects."
                  />
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-semibold mb-2">
                  <EditableText contentKey="about.features.connections.title" defaultValue="Expert Connections" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <EditableText 
                    contentKey="about.features.connections.desc" 
                    defaultValue="Experts can connect with peers in their field to build professional networks."
                  />
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <MessageSquare className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-semibold mb-2">
                  <EditableText contentKey="about.features.messaging.title" defaultValue="Direct Messaging" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <EditableText 
                    contentKey="about.features.messaging.desc" 
                    defaultValue="Communicate directly with your connections through our secure messaging system."
                  />
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              <EditableText contentKey="about.why.title" defaultValue="Why ExpertGate?" />
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item1" defaultValue="All experts are verified and their credentials are confirmed" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item2" defaultValue="Completely free to use for researchers and experts" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item3" defaultValue="Book interviews with experts for your research projects" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item4" defaultValue="Post and join research collaboration projects" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item5" defaultValue="Experts can connect with peers in their field" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item6" defaultValue="Experts control their own availability and scheduling" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item7" defaultValue="Built-in rating system ensures quality and accountability" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item8" defaultValue="Focus on academic and research integrity" /></span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span><EditableText contentKey="about.why.item9" defaultValue="Dedicated customer support for all users" /></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;
