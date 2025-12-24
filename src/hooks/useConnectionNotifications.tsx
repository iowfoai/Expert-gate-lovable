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

    // Listen for new connection requests (when someone sends you a request)
    const newRequestChannel = supabase
      .channel('new-connection-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'expert_connections',
        filter: `recipient_id=eq.${currentUserId}`
      }, async (payload) => {
        const newConnection = payload.new as any;

        // Only notify for pending requests
        if (newConnection.status === 'pending') {
          // Fetch the requester's profile
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('full_name, user_type')
            .eq('id', newConnection.requester_id)
            .single();

          if (requesterProfile) {
            const roleLabel = requesterProfile.user_type === 'expert' ? 'Expert' : 'Researcher';
            toast({
              title: "New Connection Request! 📬",
              description: `${requesterProfile.full_name} (${roleLabel}) wants to connect with you. Go to Chats to respond.`,
              duration: 10000,
            });
          }
        }
      })
      .subscribe();

    // Listen for connection status changes (when requests are accepted)
    const acceptedChannel = supabase
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
      supabase.removeChannel(newRequestChannel);
      supabase.removeChannel(acceptedChannel);
    };
  }, [toast]);
};
