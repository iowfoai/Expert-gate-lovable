import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Network, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditableText } from "@/components/EditableText";

const Footer = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUserType = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .maybeSingle();
        setUserType(profile?.user_type || null);
      } else {
        setIsLoggedIn(false);
        setUserType(null);
      }
    };

    fetchUserType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => setUserType(data?.user_type || null));
      } else {
        setIsLoggedIn(false);
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isResearcher = userType === 'researcher';
  const isExpert = userType === 'expert';

  return (
    <footer className="bg-muted border-t border-border mt-12 sm:mt-20">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Beta Notice - Top */}
        <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-border text-center">
          <p className="text-xs italic text-muted-foreground/70 max-w-2xl mx-auto px-2">
            <EditableText 
              contentKey="footer.beta.notice" 
              defaultValue="This product is still in beta. Please submit any feedback if you have suggestions or encounter any problems. You may also create a support ticket if you have issues with your account."
              multiline
            />
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Network className="w-5 h-5 text-accent" />
              <span><EditableText contentKey="footer.brand.name" defaultValue="ExpertGate" /></span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              <EditableText contentKey="footer.brand.tagline" defaultValue="Bridging Researchers & Experts conveniently & efficiently." />
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/expertgate/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">
              <EditableText contentKey="footer.platform.title" defaultValue="Platform" />
            </h4>
            <ul className="space-y-2 text-sm">
              {/* Only researchers can see Interview Experts */}
              {isResearcher && (
                <li>
                  <Link to="/find-experts" className="text-muted-foreground hover:text-accent transition-colors">
                    Interview Experts
                  </Link>
                </li>
              )}
              {/* Everyone can see Research Collab */}
              <li>
                <Link to="/research-collab" className="text-muted-foreground hover:text-accent transition-colors">
                  Research Collab
                </Link>
              </li>
              {/* Only experts can see Expert Directory */}
              {isExpert && (
                <li>
                  <Link to="/experts-directory" className="text-muted-foreground hover:text-accent transition-colors">
                    Expert Directory
                  </Link>
                </li>
              )}
              {/* Everyone can see Chats */}
              <li>
                <Link to="/connections" className="text-muted-foreground hover:text-accent transition-colors">
                  Chats
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">
              <EditableText contentKey="footer.resources.title" defaultValue="Resources" />
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">
              <EditableText contentKey="footer.legal.title" defaultValue="Legal" />
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/ethics" className="text-muted-foreground hover:text-accent transition-colors">
                  Ethics Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-accent transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            <EditableText contentKey="footer.copyright" defaultValue={`© ${new Date().getFullYear()} ExpertGate. All rights reserved.`} />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
