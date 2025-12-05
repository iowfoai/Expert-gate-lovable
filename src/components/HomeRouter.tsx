import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import ExpertHome from "@/pages/ExpertHome";

const HomeRouter = () => {
  const [userType, setUserType] = useState<'researcher' | 'expert' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUserType(null);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      setUserType(profile?.user_type || null);
      setIsLoading(false);
    };

    checkUserType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserType(null);
        setIsLoading(false);
      } else if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();
        setUserType(profile?.user_type || null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Render ExpertHome directly for experts, Index for everyone else
  if (userType === 'expert') {
    return <ExpertHome />;
  }

  return <Index />;
};

export default HomeRouter;
