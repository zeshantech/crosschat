"use client";

import { useEffect } from "react";

import { buildEventStreamUrl } from "@/lib/chat-api";
import { useChatStore } from "@/lib/state/use-chat-store";
import type { Message } from "@/lib/types/chat";

export function useChatRealtime(conversationId: string | null) {
  const appendInboundMessage = useChatStore((state) => state.appendInboundMessage);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);

  useEffect(() => {
    if (!conversationId) return;

    const source = new EventSource(buildEventStreamUrl(conversationId));

    source.addEventListener("message.created", (event) => {
      const message = JSON.parse((event as MessageEvent<string>).data) as Message;
      if (message.isInbound) {
        appendInboundMessage(conversationId, message);
      }
    });

    source.addEventListener("message.status.updated", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        id: string;
        status: Message["status"];
        conversationId: string;
      };
      updateMessageStatus(payload.conversationId, payload.id, payload.status);
    });

    return () => source.close();
  }, [appendInboundMessage, conversationId, updateMessageStatus]);
}
