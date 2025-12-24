import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePendingRequests = () => {
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const { toast } = useToast();
  const previousPendingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        userIdRef.current = session.user.id;
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      userIdRef.current = session?.user?.id || null;
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPendingRequests = useCallback(async (showToastForNew = false) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    // Fetch pending requests where the current user is the recipient
    const { data: pendingRequests, error } = await supabase
      .from('expert_connections')
      .select('id, requester_id, created_at')
      .eq('recipient_id', currentUserId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
      return;
    }

    const currentPendingIds = new Set(pendingRequests?.map(r => r.id) || []);
    const count = pendingRequests?.length || 0;
    
    // Check for new requests (ones that weren't in the previous set)
    if (showToastForNew && previousPendingIdsRef.current.size > 0) {
      const newRequests = pendingRequests?.filter(r => !previousPendingIdsRef.current.has(r.id)) || [];
      
      for (const newRequest of newRequests) {
        // Fetch requester info for the toast
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('full_name, user_type')
          .eq('id', newRequest.requester_id)
          .single();

        if (requesterProfile) {
          const roleLabel = requesterProfile.user_type === 'expert' ? 'Expert' : 'Researcher';
          toast({
            title: "New Connection Request",
            description: `${requesterProfile.full_name} (${roleLabel}) wants to connect with you. Check your Chats page to respond.`,
            duration: 10000,
          });
        }
      }
    }

    previousPendingIdsRef.current = currentPendingIds;
    setPendingCount(count);
    setHasPendingRequests(count > 0);
  }, [toast]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch without toast
    fetchPendingRequests(false);

    // Listen for new connection requests
    const channel = supabase
      .channel('pending-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'expert_connections',
        filter: `recipient_id=eq.${userId}`
      }, () => {
        // Fetch with toast enabled for new requests
        fetchPendingRequests(true);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'expert_connections',
        filter: `recipient_id=eq.${userId}`
      }, () => {
        fetchPendingRequests(false);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'expert_connections',
        filter: `recipient_id=eq.${userId}`
      }, () => {
        fetchPendingRequests(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchPendingRequests]);

  return { hasPendingRequests, pendingCount, refetch: fetchPendingRequests };
};
