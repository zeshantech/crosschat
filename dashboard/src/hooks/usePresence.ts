'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface OnlineMember {
  userId: string;
  status: string;
  lastSeen?: string;
}

export function usePresence(businessId: string, userId: string) {
  const [onlineMembers, setOnlineMembers] = useState<Record<string, OnlineMember>>({});
  const supabase = createClient();

  useEffect(() => {
    if (!businessId || !userId) return;

    const channel = supabase.channel(`presence:${businessId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const members: Record<string, OnlineMember> = {};

        Object.entries(state).forEach(([key, presences]: [string, any[]]) => {
          if (presences.length > 0) {
            members[key] = presences[0];
          }
        });

        setOnlineMembers(members);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            status: 'online',
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // Update user status in database
    supabase
      .from('users')
      .update({ status: 'online', last_seen_at: new Date().toISOString() })
      .eq('id', userId)
      .then(() => {});

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        channel.track({
          userId,
          status: 'away',
          onlineAt: new Date().toISOString(),
        });
      } else {
        channel.track({
          userId,
          status: 'online',
          onlineAt: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      channel.untrack();
      supabase.removeChannel(channel);

      // Update user status to offline
      supabase
        .from('users')
        .update({ status: 'offline', last_seen_at: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {});
    };
  }, [businessId, userId]);

  return { onlineMembers };
}
