import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import ExpertHome from "@/pages/ExpertHome";

const HomeRouter = () => {
  const [userType, setUserType] = useState<'researcher' | 'expert' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUserType = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();
      
      if (isMounted) {
        setUserType(profile?.user_type || null);
        setIsLoading(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session?.user) {
        fetchUserType(session.user.id);
      } else {
        setUserType(null);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      if (session?.user) {
        fetchUserType(session.user.id);
      } else {
        setUserType(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (userType === 'expert') {
    return <ExpertHome />;
  }

  return <Index />;
};

export default HomeRouter;
