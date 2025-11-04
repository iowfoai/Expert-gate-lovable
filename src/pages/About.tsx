import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Users, Shield } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About ExpertGate</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Bridging Researchers and Experts — Ethically and Effortlessly
          </p>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-muted-foreground leading-relaxed">
              ExpertGate was founded on a simple observation: researchers often struggle to find and connect 
              with the right experts for their work. Whether you're a student working on a thesis, a journalist 
              investigating a story, or a professional researcher conducting a study, finding verified experts 
              who are willing and available for interviews can be a major challenge.
            </p>
            
            <p className="text-muted-foreground leading-relaxed mt-4">
              We built ExpertGate to solve this problem. Our platform makes it easy to discover, connect with, 
              and interview experts across dozens of fields — all while maintaining the highest standards of 
              academic integrity and ethical research practices.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2">
              <CardContent className="pt-6">
                <Target className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p className="text-muted-foreground">
                  To democratize access to expert knowledge and make professional research interviews 
                  accessible, ethical, and efficient for everyone.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Heart className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Values</h3>
                <p className="text-muted-foreground">
                  Integrity, transparency, and respect for both researchers and experts guide everything 
                  we do on ExpertGate.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Users className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Community</h3>
                <p className="text-muted-foreground">
                  Over 500 verified experts and thousands of researchers trust ExpertGate for their 
                  professional interview needs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Ethics</h3>
                <p className="text-muted-foreground">
                  We ensure fair compensation, protect against interview fatigue, and maintain strict 
                  verification standards for all experts.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Why ExpertGate?</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>All experts are verified and their credentials are confirmed</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Transparent pricing with only a small $1.50 platform fee</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Interview limits protect experts from being overwhelmed</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Built-in rating system ensures quality and accountability</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>Focus on academic and research integrity</span>
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
