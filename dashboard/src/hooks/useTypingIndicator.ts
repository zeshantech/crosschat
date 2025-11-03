'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTypingIndicator(conversationId: string, userId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();

  const startTyping = useCallback(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: true },
    });
  }, [conversationId, userId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: false },
    });
  }, [conversationId, userId]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setTypingUsers((prev) => {
            if (payload.isTyping) {
              return [...new Set([...prev, payload.userId])];
            } else {
              return prev.filter((id) => id !== payload.userId);
            }
          });

          // Auto-remove after 3 seconds
          if (payload.isTyping) {
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
            }, 3000);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  return { typingUsers, startTyping, stopTyping };
}
