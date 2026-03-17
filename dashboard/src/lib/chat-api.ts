import type { Conversation, Message } from "@/lib/types/chat";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

type ApiMessage = Message & { encryptedContent?: string };

export async function fetchConversations() {
  const response = await fetch(`${BACKEND_URL}/chat/conversations`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to fetch conversations");
  }

  return (await response.json()) as Conversation[];
}

export async function postMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
  isInbound?: boolean;
}) {
  const response = await fetch(`${BACKEND_URL}/chat/conversations/${input.conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderId: input.senderId,
      content: input.content,
      isInbound: input.isInbound,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send message");
  }

  return (await response.json()) as ApiMessage;
}

export function buildEventStreamUrl(conversationId: string) {
  const url = new URL(`${BACKEND_URL}/chat/stream`);
  url.searchParams.set("conversationId", conversationId);
  return url.toString();
}
