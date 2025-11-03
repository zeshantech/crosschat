'use client';

import { useState } from 'react';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Inbox, UserCircle, CheckCircle2, Archive } from 'lucide-react';

interface ConversationListProps {
  businessId: string;
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
}

export function ConversationList({
  businessId,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'assigned' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterConfig =
    filter === 'unassigned'
      ? { unassignedOnly: true }
      : filter !== 'all'
      ? { status: filter }
      : undefined;

  const { conversations, loading } = useRealtimeConversations(businessId, filterConfig);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.customer?.name?.toLowerCase().includes(query) ||
      conv.customer?.email?.toLowerCase().includes(query) ||
      conv.subject?.toLowerCase().includes(query)
    );
  });

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      whatsapp: '💬',
      instagram: '📷',
      facebook: '👍',
      email: '📧',
      widget: '🌐',
      telegram: '✈️',
      twitter: '🐦',
    };
    return icons[platform] || '💬';
  };

  return (
    <div className="flex flex-col h-full border-r">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-4 border-b overflow-x-auto">
        <Badge
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer whitespace-nowrap"
          onClick={() => setFilter('all')}
        >
          <Inbox className="h-3 w-3 mr-1" />
          All
        </Badge>
        <Badge
          variant={filter === 'open' ? 'default' : 'outline'}
          className="cursor-pointer whitespace-nowrap"
          onClick={() => setFilter('open')}
        >
          Open
        </Badge>
        <Badge
          variant={filter === 'assigned' ? 'default' : 'outline'}
          className="cursor-pointer whitespace-nowrap"
          onClick={() => setFilter('assigned')}
        >
          <UserCircle className="h-3 w-3 mr-1" />
          Assigned
        </Badge>
        <Badge
          variant={filter === 'unassigned' ? 'default' : 'outline'}
          className="cursor-pointer whitespace-nowrap"
          onClick={() => setFilter('unassigned')}
        >
          Unassigned
        </Badge>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No conversations found</div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{getPlatformIcon(conversation.platform)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {conversation.customer?.name || conversation.customer?.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.subject || 'No subject'}
                      </p>
                    </div>
                  </div>
                  {conversation.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {conversation.last_message_at
                      ? new Date(conversation.last_message_at).toLocaleString()
                      : 'No messages'}
                  </span>
                  <div className="flex items-center gap-1">
                    {conversation.status === 'resolved' && (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    )}
                    {conversation.status === 'archived' && (
                      <Archive className="h-3 w-3 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
