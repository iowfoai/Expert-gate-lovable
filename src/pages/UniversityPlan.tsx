import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CheckCircle, Building2, Users, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const UniversityPlan = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Building2 className="w-16 h-16 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              University Plan
            </h1>
            <p className="text-xl text-muted-foreground">
              Empower your entire research community with unlimited access
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="border-2 border-accent mb-12">
            <CardContent className="pt-8 text-center">
              <div className="text-5xl font-bold mb-2">$40<span className="text-2xl font-normal text-muted-foreground">/month</span></div>
              <p className="text-muted-foreground mb-6">Billed monthly, cancel anytime</p>
              <Button size="lg" className="mb-4">
                Contact Sales
              </Button>
              <p className="text-sm text-muted-foreground">Payment integration coming soon</p>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-accent" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Unlimited Researcher Accounts</strong>
                    <p className="text-muted-foreground text-sm">All researchers at your institution can use ExpertGate for free</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>No Commission Fees</strong>
                    <p className="text-muted-foreground text-sm">Zero platform fees per interview - unlimited interviews included</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Priority Support</strong>
                    <p className="text-muted-foreground text-sm">Dedicated support channel for your institution</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Usage Analytics</strong>
                    <p className="text-muted-foreground text-sm">Track platform usage and researcher engagement across your institution</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Custom Branding</strong>
                    <p className="text-muted-foreground text-sm">Add your institution's logo and branding to the platform</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-accent" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">1. Subscription Terms</h4>
                <p>The University Plan is billed monthly at $40/month. The subscription automatically renews each month unless cancelled at least 24 hours before the renewal date.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">2. User Access</h4>
                <p>The subscription covers unlimited researcher accounts from your institution. Each researcher must verify their institutional email address to gain access.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">3. Interview Fees</h4>
                <p>Under the University Plan, there are no platform commission fees for interviews conducted by researchers from your institution. Experts may still charge their own consultation fees independently.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">4. Cancellation Policy</h4>
                <p>You may cancel your subscription at any time. Upon cancellation, your institution will retain access until the end of the current billing period. No refunds are provided for partial months.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">5. Data & Privacy</h4>
                <p>All user data is handled in accordance with our Privacy Policy. Your institution's usage data and analytics remain confidential and are only accessible to authorized administrators.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">6. Support & Service Level</h4>
                <p>University Plan subscribers receive priority support with response times within 24 hours. We maintain 99.9% uptime for platform availability.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">7. Changes to Terms</h4>
                <p>We reserve the right to modify these terms with 30 days notice. Price changes will be communicated 60 days in advance.</p>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-8 text-center">
              <TrendingUp className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Ready to Transform Your Research Community?</h3>
              <p className="text-muted-foreground mb-6">
                Join leading universities already using ExpertGate to connect their researchers with experts worldwide
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Contact Sales
                </Button>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Ask Questions
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Payment integration coming soon</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UniversityPlan;
