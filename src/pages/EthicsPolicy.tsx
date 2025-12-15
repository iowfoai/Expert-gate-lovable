import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Users, Eye, Scale, Ban, CheckCircle, AlertTriangle } from "lucide-react";

const EthicsPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Ethics Policy</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Our commitment to ethical research practices and expert well-being
          </p>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-muted-foreground leading-relaxed">
              ExpertGate is built on a foundation of ethical principles that guide every aspect of our platform. 
              We believe that connecting researchers with experts should be done responsibly, with respect for 
              all parties involved and adherence to the highest standards of research integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2">
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Expert Protection</h3>
                <p className="text-muted-foreground">
                  We implement interview limits to prevent expert fatigue and ensure sustainable participation 
                  in research activities.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Eye className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                <p className="text-muted-foreground">
                  All interactions on our platform are transparent. Researchers must clearly state their 
                  research purposes and institutional affiliations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Scale className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fair Treatment</h3>
                <p className="text-muted-foreground">
                  We ensure fair treatment of all users regardless of their institution, background, 
                  or research field.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Heart className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Respect</h3>
                <p className="text-muted-foreground">
                  We foster a culture of mutual respect between researchers and experts, valuing each 
                  party's time and contributions.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-accent" />
                For Researchers
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Expected Conduct
                </h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• Clearly communicate research objectives and intended use of information</li>
                  <li>• Respect expert availability and interview limits</li>
                  <li>• Obtain appropriate institutional ethics approval when required</li>
                  <li>• Properly cite and attribute expert contributions</li>
                  <li>• Maintain confidentiality when requested</li>
                  <li>• Provide accurate information about your research and institution</li>
                </ul>
                
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  Prohibited Actions
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Misrepresenting research purposes or institutional affiliation</li>
                  <li>• Pressuring experts to participate or exceed their limits</li>
                  <li>• Using expert information for undisclosed commercial purposes</li>
                  <li>• Recording interviews without explicit consent</li>
                  <li>• Sharing expert contact information without permission</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-accent" />
                For Experts
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Expected Conduct
                </h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• Provide accurate credentials and expertise information</li>
                  <li>• Respond to interview requests in a timely manner</li>
                  <li>• Disclose any conflicts of interest</li>
                  <li>• Maintain professional conduct during all interactions</li>
                  <li>• Respect researcher confidentiality when appropriate</li>
                  <li>• Provide honest and unbiased expertise</li>
                </ul>
                
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  Prohibited Actions
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Misrepresenting credentials or expertise</li>
                  <li>• Providing intentionally misleading information</li>
                  <li>• Soliciting payment outside the platform</li>
                  <li>• Engaging in discriminatory behavior</li>
                  <li>• Sharing researcher information without consent</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-accent" />
                Reporting Violations
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you witness or experience any violations of our ethics policy, please report them 
                  immediately through our Support page. All reports are treated confidentially, and we 
                  take appropriate action to address violations.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Consequences for violations may include warnings, temporary suspension, permanent account 
                  termination, or reporting to relevant professional bodies as appropriate.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Platform Commitments</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>We verify all expert credentials before they can accept interviews</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>We enforce interview limits to protect expert well-being</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>We provide mechanisms for reporting unethical behavior</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>We do not sell user data to third parties</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>We maintain transparency in our policies and practices</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>We continuously review and improve our ethical standards</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EthicsPolicy;
