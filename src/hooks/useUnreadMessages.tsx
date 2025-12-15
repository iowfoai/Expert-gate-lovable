import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessages = () => {
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadConnectionIds, setUnreadConnectionIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const pendingMarkAsRead = useRef<Set<string>>(new Set());

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

    const { data: connections, error } = await supabase
      .from('expert_connections')
      .select('id, requester_id, recipient_id, has_unread_for_requester, has_unread_for_recipient')
      .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching unread status:', error);
      return;
    }

    const unreadIds = new Set<string>();
    
    connections?.forEach(conn => {
      // Skip connections that are pending mark as read
      if (pendingMarkAsRead.current.has(conn.id)) return;
      
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

    // Listen for message changes - but debounce to avoid rapid refetches
    let debounceTimeout: number | null = null;
    const debouncedFetch = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = window.setTimeout(() => {
        fetchUnreadStatus();
      }, 500);
    };

    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, debouncedFetch)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'expert_connections'
      }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadStatus]);

  const markAsRead = useCallback(async (connectionId: string) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    // Add to pending to prevent fetch from overriding
    pendingMarkAsRead.current.add(connectionId);

    // Update local state immediately
    setUnreadConnectionIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(connectionId);
      setHasUnread(newSet.size > 0);
      return newSet;
    });

    // Get the connection to determine if user is requester or recipient
    const { data: connection, error: fetchError } = await supabase
      .from('expert_connections')
      .select('requester_id, recipient_id')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      console.error('Error fetching connection for markAsRead:', fetchError);
      pendingMarkAsRead.current.delete(connectionId);
      return;
    }

    const isRequester = connection.requester_id === currentUserId;
    const updateField = isRequester ? 'has_unread_for_requester' : 'has_unread_for_recipient';

    const { error: updateError } = await supabase
      .from('expert_connections')
      .update({ [updateField]: false })
      .eq('id', connectionId);

    if (updateError) {
      console.error('Error marking as read:', updateError);
      // Revert local state if update failed
      setUnreadConnectionIds(prev => {
        const newSet = new Set(prev);
        newSet.add(connectionId);
        setHasUnread(true);
        return newSet;
      });
    }

    // Remove from pending after a delay to let any concurrent fetches complete
    setTimeout(() => {
      pendingMarkAsRead.current.delete(connectionId);
    }, 1000);
  }, []);

  return { hasUnread, unreadConnectionIds, markAsRead, refetch: fetchUnreadStatus };
};
