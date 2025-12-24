import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Beta Notice */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground italic text-center">
              This product is currently in beta. Policies may be updated as we continue to develop and improve the platform.
            </p>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2024</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using ExpertGate, you agree to be bound by these Terms of Service and all 
                applicable laws and regulations. If you do not agree with any of these terms, you are 
                prohibited from using or accessing this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Types</h2>
              <h3 className="text-xl font-medium mb-3">Researchers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Researchers may use the platform to find and connect with verified experts for interviews 
                and collaboration. Researchers can request interviews, create collaboration posts to find 
                experts for their projects, and communicate with connected experts through our messaging 
                system. Researchers must conduct themselves professionally and respect expert availability and time.
              </p>
              
              <h3 className="text-xl font-medium mb-3 mt-4">Experts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experts must provide accurate credentials and undergo verification before they can accept 
                interview requests or apply to collaboration posts. Experts can connect with researchers, 
                respond to interview requests, apply to collaboration posts, and participate in project 
                groups. Experts are expected to respond to requests in a timely manner and maintain 
                professional conduct.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>Use the platform for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Submit false or misleading information</li>
                <li>Spam or send unsolicited communications</li>
                <li>Attempt to gain unauthorized access to the platform</li>
                <li>Interfere with the proper functioning of the platform</li>
                <li>Use the platform for commercial solicitation without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Expert Verification</h2>
              <p className="text-muted-foreground leading-relaxed">
                All experts must undergo a verification process. We reserve the right to reject or revoke 
                verification status at our discretion. Verification indicates credential review but does 
                not constitute an endorsement of the expert's opinions or work.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Platform Features</h2>
              <h3 className="text-xl font-medium mb-3">Interview Requests</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Researchers can request interviews with verified experts. Experts control their own 
                availability and may accept or decline interview requests. Researchers must respect 
                expert availability settings and not attempt to pressure experts for interviews.
              </p>
              
              <h3 className="text-xl font-medium mb-3">Collaboration Posts</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Researchers can create collaboration posts to find experts for specific projects or 
                research topics. Verified experts can apply to these posts. Post authors can review 
                applications and accept or reject applicants to form project groups.
              </p>
              
              <h3 className="text-xl font-medium mb-3">Project Groups</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When collaboration applications are accepted, project groups are formed for team 
                communication. Group members can communicate through the group messaging system. 
                Group owners can manage membership.
              </p>
              
              <h3 className="text-xl font-medium mb-3">Connections and Messaging</h3>
              <p className="text-muted-foreground leading-relaxed">
                Verified experts can send connection requests to researchers. Once a connection is 
                accepted, both parties can communicate through private messaging. Messages are only 
                visible to the connected parties and are not shared publicly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Free Platform Model</h2>
              <p className="text-muted-foreground leading-relaxed">
                ExpertGate is provided free of charge to all users to maintain academic integrity and 
                ensure equal access to expert knowledge. We do not charge fees for interviews, 
                collaborations, or any platform features. This model ensures that financial barriers 
                do not prevent meaningful research connections.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Content and Communications</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users retain ownership of content they create. By using our platform, you grant us a license 
                to display your profile information and facilitate communications. Private messages between 
                users are not shared publicly. We may remove content that violates these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The ExpertGate platform, including its design, features, and content (excluding user-generated 
                content), is owned by us and protected by intellectual property laws. You may not copy, 
                modify, or distribute our platform without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed">
                The platform is provided "as is" without warranties of any kind. We do not guarantee the 
                accuracy of expert credentials beyond our verification process. We are not responsible for 
                the content of interviews, the quality of expert opinions, or the outcomes of collaborations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, ExpertGate shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account at any time for violations of these terms or for 
                any other reason at our discretion. You may delete your account at any time through your 
                account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant 
                changes. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms shall be governed by and construed in accordance with applicable laws, without 
                regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Support and Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service or to report issues, please contact us through 
                our Support page. Our support system allows you to create tickets and communicate directly 
                with our team.
              </p>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
