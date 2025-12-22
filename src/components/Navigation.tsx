import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Network, LogOut, User, Settings, History, UserCircle, Users, Home, MessageSquare, Shield, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [userType, setUserType] = useState<string | null>(null);
  const { isAdmin } = useAdminStatus();
  const { hasUnread } = useUnreadMessages();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileName("");
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, user_type")
      .eq("id", userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfileName(data.full_name);
      setUserType(data.user_type);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/");
    }
  };

  const isExpert = userType === 'expert';

  const linkClass = "text-sm font-medium hover:text-accent transition-all duration-300 relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-0.5 after:bg-accent after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left";

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-all duration-300">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={isExpert ? "/expert-home" : "/"} className="flex items-center gap-2 text-xl font-semibold hover:scale-105 transition-transform duration-300">
          <Network className="w-6 h-6 text-accent" />
          <span>ExpertGate</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          {isExpert ? (
            <>
              <Link to="/expert-home" className={linkClass}>
                Home
              </Link>
              <Link to="/experts-directory" className={linkClass}>
                Interview Experts
              </Link>
              <Link to="/research-collab" className={linkClass}>
                Research Collab
              </Link>
              <Link to="/connections" className={`${linkClass} relative`}>
                Chats
                {hasUnread && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Link>
              <Link to="/expert-dashboard" className={linkClass}>
                Dashboard
              </Link>
            </>
          ) : user ? (
            <>
              <Link to="/find-experts" className={linkClass}>
                Interview Experts
              </Link>
              <Link to="/research-collab" className={linkClass}>
                Research Collab
              </Link>
              <Link to="/interviews" className={linkClass}>
                Interviews
              </Link>
              <Link to="/connections" className={`${linkClass} relative`}>
                Chats
                {hasUnread && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-destructive rounded-full" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to="/find-experts" className={linkClass}>
                Interview Experts
              </Link>
              <Link to="/how-it-works" className={linkClass}>
                How It Works
              </Link>
            </>
          )}
          <Link to="/about" className={linkClass}>
            About
          </Link>
          <Link to="/support" className={linkClass}>
            Support
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">{profileName || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isExpert && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/expert-home")}>
                      <Home className="w-4 h-4 mr-2" />
                      Expert Home
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/experts-directory")}>
                      <Users className="w-4 h-4 mr-2" />
                      Interview Experts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/research-collab")}>
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Research Collab
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/connections")} className="relative">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chats
                      {hasUnread && (
                        <span className="absolute right-2 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isExpert && user && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/research-collab")}>
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Research Collab
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/connections")} className="relative">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chats
                      {hasUnread && (
                        <span className="absolute right-2 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account-settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/interview-history")}>
                  <History className="w-4 h-4 mr-2" />
                  Interview History
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin-panel")}>
                      <Shield className="w-4 h-4 mr-2 text-destructive" />
                      <span className="text-destructive">Admin Panel</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
