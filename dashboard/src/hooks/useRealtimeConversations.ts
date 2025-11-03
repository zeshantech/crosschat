'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Conversation {
  id: string;
  business_id: string;
  customer_id: string;
  platform: string;
  status: string;
  assigned_to?: string;
  assigned_type: string;
  subject?: string;
  priority: string;
  total_messages: number;
  unread_count: number;
  last_message_at?: string;
  created_at: string;
  customer?: any;
  assigned_member?: any;
}

export function useRealtimeConversations(businessId: string, filters?: {
  status?: string;
  assignedTo?: string;
  unassignedOnly?: boolean;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!businessId) return;

    // Initial fetch
    const fetchConversations = async () => {
      setLoading(true);
      let query = supabase
        .from('conversations')
        .select(`
          *,
          customer:customers(*),
          assigned_member:team_members(
            id,
            user:users(
              id,
              full_name,
              avatar_url,
              email
            )
          )
        `)
        .eq('business_id', businessId)
        .is('deleted_at', null)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.unassignedOnly) {
        query = query.is('assigned_to', null);
      }

      const { data } = await query;

      if (data) setConversations(data);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to conversation changes
    const channel = supabase
      .channel(`business:${businessId}:conversations`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full conversation with relations
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                customer:customers(*),
                assigned_member:team_members(
                  id,
                  user:users(*)
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setConversations((prev) => [data, ...prev]);
              showDesktopNotification('New Conversation', 'You have a new conversation');
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                customer:customers(*),
                assigned_member:team_members(
                  id,
                  user:users(*)
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setConversations((prev) =>
                prev.map((conv) => (conv.id === data.id ? data : conv))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) =>
              prev.filter((conv) => conv.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, filters?.status, filters?.assignedTo, filters?.unassignedOnly]);

  return { conversations, loading };
}

function showDesktopNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.png' });
  }
}
