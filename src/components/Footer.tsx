import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Network, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    <footer className="bg-muted border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Beta Notice - Top */}
        <div className="mb-8 pb-8 border-b border-border text-center">
          <p className="text-xs italic text-muted-foreground/70 max-w-2xl mx-auto">
            This product is still in beta. Please{" "}
            <Link to="/support" className="underline hover:text-accent">submit any feedback</Link>{" "}
            if you have suggestions or encounter any problems. You may also{" "}
            <Link to="/support" className="underline hover:text-accent">create a support ticket</Link>{" "}
            if you have issues with your account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Network className="w-5 h-5 text-accent" />
              <span>ExpertGate</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Bridging researchers and experts in the most efficient way possible.
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
            <h4 className="font-semibold mb-4">Platform</h4>
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
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-accent transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
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
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ExpertGate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
