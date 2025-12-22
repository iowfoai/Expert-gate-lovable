import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContentItem {
  content_key: string;
  content_value: string;
}

// Global cache for content
let contentCache: Map<string, string> = new Map();
let cacheInitialized = false;
let initializationPromise: Promise<void> | null = null;

export const useSiteContent = () => {
  const [content, setContent] = useState<Map<string, string>>(contentCache);
  const [loading, setLoading] = useState(!cacheInitialized);

  const fetchAllContent = useCallback(async () => {
    const { data, error } = await supabase
      .from("site_content")
      .select("content_key, content_value");

    if (!error && data) {
      const newCache = new Map<string, string>();
      data.forEach((item: ContentItem) => {
        newCache.set(item.content_key, item.content_value);
      });
      contentCache = newCache;
      cacheInitialized = true;
      setContent(newCache);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initialize content if not already done
    if (!cacheInitialized) {
      if (!initializationPromise) {
        initializationPromise = fetchAllContent();
      }
      initializationPromise.then(() => {
        setContent(contentCache);
        setLoading(false);
      });
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel("site-content-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_content",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newItem = payload.new as ContentItem;
            contentCache.set(newItem.content_key, newItem.content_value);
            setContent(new Map(contentCache));
          } else if (payload.eventType === "DELETE") {
            const oldItem = payload.old as ContentItem;
            contentCache.delete(oldItem.content_key);
            setContent(new Map(contentCache));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllContent]);

  const getContent = useCallback(
    (key: string, defaultValue: string): string => {
      return content.get(key) ?? defaultValue;
    },
    [content]
  );

  const updateContent = useCallback(
    async (key: string, value: string): Promise<boolean> => {
      // Check if content exists
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("content_key", key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("site_content")
          .update({ content_value: value })
          .eq("content_key", key);
        return !error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert({ content_key: key, content_value: value });
        return !error;
      }
    },
    []
  );

  return { content, loading, getContent, updateContent };
};
