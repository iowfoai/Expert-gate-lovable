import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadConnectionIds, setUnreadConnectionIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

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

  const fetchUnreadStatus = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    // Check for unread messages across all connections
    const { data: connections } = await supabase
      .from('expert_connections')
      .select('id, requester_id, recipient_id, has_unread_for_requester, has_unread_for_recipient')
      .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .eq('status', 'accepted');

    const unreadIds = new Set<string>();
    
    connections?.forEach(conn => {
      const isRequester = conn.requester_id === currentUserId;
      if ((isRequester && conn.has_unread_for_requester) || 
          (!isRequester && conn.has_unread_for_recipient)) {
        unreadIds.add(conn.id);
      }
    });

    setUnreadConnectionIds(unreadIds);
    setHasUnread(unreadIds.size > 0);
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchUnreadStatus();

    // Listen for message changes
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchUnreadStatus();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'expert_connections'
      }, () => {
        fetchUnreadStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadStatus]);

  const markAsRead = useCallback(async (connectionId: string) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    // Get the connection to determine if user is requester or recipient
    const { data: connection } = await supabase
      .from('expert_connections')
      .select('requester_id, recipient_id')
      .eq('id', connectionId)
      .single();

    if (!connection) return;

    const isRequester = connection.requester_id === currentUserId;
    const updateField = isRequester ? 'has_unread_for_requester' : 'has_unread_for_recipient';

    await supabase
      .from('expert_connections')
      .update({ [updateField]: false })
      .eq('id', connectionId);

    // Update local state immediately
    setUnreadConnectionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(connectionId);
      setHasUnread(newSet.size > 0);
      return newSet;
    });
  }, []);

  return { hasUnread, unreadConnectionIds, markAsRead, refetch: fetchUnreadStatus };
};
