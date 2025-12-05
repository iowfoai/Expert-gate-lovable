import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type UserType = 'researcher' | 'expert' | null;

interface UseUserTypeGuardResult {
  isLoading: boolean;
  userType: UserType;
  userId: string | null;
}

export const useUserTypeGuard = (
  allowedTypes: UserType[],
  redirectPath?: string
): UseUserTypeGuardResult => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUserType = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .maybeSingle();

      const type = profile?.user_type as UserType;
      setUserType(type);

      if (type && !allowedTypes.includes(type)) {
        // Redirect to appropriate page based on user type
        const redirect = redirectPath || (type === 'expert' ? '/expert-home' : '/');
        navigate(redirect);
      }

      setIsLoading(false);
    };

    checkUserType();
  }, [navigate, allowedTypes, redirectPath]);

  return { isLoading, userType, userId };
};
