import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useConnectionNotifications = () => {
  const { toast } = useToast();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        userIdRef.current = session.user.id;
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      userIdRef.current = session?.user?.id || null;
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    // Listen for connection status changes (when requests are accepted)
    const channel = supabase
      .channel('connection-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'expert_connections',
        filter: `requester_id=eq.${currentUserId}`
      }, async (payload) => {
        const newConnection = payload.new as any;
        const oldConnection = payload.old as any;

        // Only notify if status changed to accepted
        if (oldConnection.status === 'pending' && newConnection.status === 'accepted') {
          // Fetch the accepter's profile
          const { data: accepterProfile } = await supabase
            .from('profiles')
            .select('full_name, user_type')
            .eq('id', newConnection.recipient_id)
            .single();

          if (accepterProfile) {
            const roleLabel = accepterProfile.user_type === 'expert' ? 'Expert' : 'Researcher';
            toast({
              title: "Connection Request Accepted! 🎉",
              description: `${accepterProfile.full_name} (${roleLabel}) has accepted your connection request. You can now chat with them!`,
              duration: 10000,
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
};
