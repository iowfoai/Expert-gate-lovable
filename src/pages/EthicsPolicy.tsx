import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Users, Eye, Scale, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { EditableText } from "@/components/EditableText";

const EthicsPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Beta Notice */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground italic text-center">
              <EditableText 
                contentKey="ethics.beta.notice" 
                defaultValue="This product is currently in beta. Policies may be updated as we continue to develop and improve the platform."
              />
            </p>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <EditableText contentKey="ethics.title" defaultValue="Ethics Policy" />
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            <EditableText 
              contentKey="ethics.subtitle" 
              defaultValue="Our commitment to ethical research practices and expert well-being"
            />
          </p>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-muted-foreground leading-relaxed">
              <EditableText 
                contentKey="ethics.intro" 
                defaultValue="ExpertGate is built on a foundation of ethical principles that guide every aspect of our platform. We believe that connecting researchers with experts should be done responsibly, with respect for all parties involved and adherence to the highest standards of research integrity."
                multiline
              />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2">
              <CardContent className="pt-6">
                <Shield className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="ethics.protection.title" defaultValue="Expert Protection" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="ethics.protection.desc" 
                    defaultValue="We empower experts to control their availability and ensure sustainable participation in research activities."
                  />
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Eye className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="ethics.transparency.title" defaultValue="Transparency" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="ethics.transparency.desc" 
                    defaultValue="All interactions on our platform are transparent. Researchers must clearly state their research purposes and institutional affiliations."
                  />
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Scale className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="ethics.fairness.title" defaultValue="Fair Treatment" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="ethics.fairness.desc" 
                    defaultValue="We ensure fair treatment of all users regardless of their institution, background, or research field."
                  />
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2">
              <CardContent className="pt-6">
                <Heart className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  <EditableText contentKey="ethics.respect.title" defaultValue="Respect" />
                </h3>
                <p className="text-muted-foreground">
                  <EditableText 
                    contentKey="ethics.respect.desc" 
                    defaultValue="We foster a culture of mutual respect between researchers and experts, valuing each party's time and contributions."
                  />
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-accent" />
                <EditableText contentKey="ethics.researchers.title" defaultValue="For Researchers" />
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <EditableText contentKey="ethics.researchers.expected.title" defaultValue="Expected Conduct" />
                </h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• <EditableText contentKey="ethics.researchers.expected.item1" defaultValue="Clearly communicate research objectives and intended use of information" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.expected.item2" defaultValue="Respect expert availability and scheduling preferences" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.expected.item3" defaultValue="Obtain appropriate institutional ethics approval when required" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.expected.item4" defaultValue="Properly cite and attribute expert contributions" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.expected.item5" defaultValue="Maintain confidentiality when requested" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.expected.item6" defaultValue="Provide accurate information about your research and institution" /></li>
                </ul>
                
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  <EditableText contentKey="ethics.researchers.prohibited.title" defaultValue="Prohibited Actions" />
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <EditableText contentKey="ethics.researchers.prohibited.item1" defaultValue="Misrepresenting research purposes or institutional affiliation" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.prohibited.item2" defaultValue="Pressuring experts to participate or exceed their limits" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.prohibited.item3" defaultValue="Using expert information for undisclosed commercial purposes" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.prohibited.item4" defaultValue="Recording interviews without explicit consent" /></li>
                  <li>• <EditableText contentKey="ethics.researchers.prohibited.item5" defaultValue="Sharing expert contact information without permission" /></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-accent" />
                <EditableText contentKey="ethics.experts.title" defaultValue="For Experts" />
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <EditableText contentKey="ethics.experts.expected.title" defaultValue="Expected Conduct" />
                </h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• <EditableText contentKey="ethics.experts.expected.item1" defaultValue="Provide accurate credentials and expertise information" /></li>
                  <li>• <EditableText contentKey="ethics.experts.expected.item2" defaultValue="Respond to interview requests in a timely manner" /></li>
                  <li>• <EditableText contentKey="ethics.experts.expected.item3" defaultValue="Disclose any conflicts of interest" /></li>
                  <li>• <EditableText contentKey="ethics.experts.expected.item4" defaultValue="Maintain professional conduct during all interactions" /></li>
                  <li>• <EditableText contentKey="ethics.experts.expected.item5" defaultValue="Respect researcher confidentiality when appropriate" /></li>
                  <li>• <EditableText contentKey="ethics.experts.expected.item6" defaultValue="Provide honest and unbiased expertise" /></li>
                </ul>
                
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  <EditableText contentKey="ethics.experts.prohibited.title" defaultValue="Prohibited Actions" />
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <EditableText contentKey="ethics.experts.prohibited.item1" defaultValue="Misrepresenting credentials or expertise" /></li>
                  <li>• <EditableText contentKey="ethics.experts.prohibited.item2" defaultValue="Providing intentionally misleading information" /></li>
                  <li>• <EditableText contentKey="ethics.experts.prohibited.item3" defaultValue="Soliciting payment outside the platform" /></li>
                  <li>• <EditableText contentKey="ethics.experts.prohibited.item4" defaultValue="Engaging in discriminatory behavior" /></li>
                  <li>• <EditableText contentKey="ethics.experts.prohibited.item5" defaultValue="Sharing researcher information without consent" /></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-accent" />
                <EditableText contentKey="ethics.reporting.title" defaultValue="Reporting Violations" />
              </h2>
              <div className="bg-muted/30 rounded-lg p-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <EditableText 
                    contentKey="ethics.reporting.desc1" 
                    defaultValue="If you witness or experience any violations of our ethics policy, please report them immediately through our Support page. All reports are treated confidentially, and we take appropriate action to address violations."
                    multiline
                  />
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <EditableText 
                    contentKey="ethics.reporting.desc2" 
                    defaultValue="Consequences for violations may include warnings, temporary suspension, permanent account termination, or reporting to relevant professional bodies as appropriate."
                    multiline
                  />
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                <EditableText contentKey="ethics.commitments.title" defaultValue="Our Platform Commitments" />
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span><EditableText contentKey="ethics.commitments.item1" defaultValue="We verify all expert credentials before they can accept interviews" /></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span><EditableText contentKey="ethics.commitments.item2" defaultValue="We give experts full control over their availability" /></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span><EditableText contentKey="ethics.commitments.item3" defaultValue="We provide mechanisms for reporting unethical behavior" /></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span><EditableText contentKey="ethics.commitments.item4" defaultValue="We do not sell user data to third parties" /></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span><EditableText contentKey="ethics.commitments.item5" defaultValue="We maintain transparency in our policies and practices" /></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span><EditableText contentKey="ethics.commitments.item6" defaultValue="We continuously review and improve our ethical standards" /></span>
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
