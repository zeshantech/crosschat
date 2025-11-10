import {
  Bot,
  Circle,
  Disc,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Pocket,
  Send,
  Slack,
  Smartphone,
  Twitter,
  Vibrate,
} from "lucide-react";
import type { ComponentType } from "react";

import { MessagingPlatform } from "@/lib/types/chat";

type PlatformMeta = {
  id: MessagingPlatform;
  name: string;
  accent: string;
  icon: ComponentType<{ className?: string }>;
};

export const PLATFORM_META: Record<MessagingPlatform, PlatformMeta> = {
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    accent: "#25d366",
    icon: MessageCircle,
  },
  messenger: {
    id: "messenger",
    name: "Messenger",
    accent: "#0084ff",
    icon: MessageSquare,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    accent: "#f56040",
    icon: Instagram,
  },
  slack: {
    id: "slack",
    name: "Slack",
    accent: "#611f69",
    icon: Slack,
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    accent: "#0088cc",
    icon: Send,
  },
  discord: {
    id: "discord",
    name: "Discord",
    accent: "#5865f2",
    icon: Disc,
  },
  line: {
    id: "line",
    name: "LINE",
    accent: "#06c755",
    icon: Pocket,
  },
  wechat: {
    id: "wechat",
    name: "WeChat",
    accent: "#7bb32e",
    icon: Bot,
  },
  twitter: {
    id: "twitter",
    name: "Twitter / X",
    accent: "#1da1f2",
    icon: Twitter,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    accent: "#0a66c2",
    icon: Linkedin,
  },
  skype: {
    id: "skype",
    name: "Skype",
    accent: "#00aff0",
    icon: Smartphone,
  },
  viber: {
    id: "viber",
    name: "Viber",
    accent: "#7360f2",
    icon: Vibrate,
  },
  signal: {
    id: "signal",
    name: "Signal",
    accent: "#3a76f0",
    icon: Smartphone,
  },
  email: {
    id: "email",
    name: "Email",
    accent: "#6c5ce7",
    icon: Mail,
  },
  sms: {
    id: "sms",
    name: "SMS",
    accent: "#00c853",
    icon: Smartphone,
  },
  unknown: {
    id: "unknown",
    name: "Unknown",
    accent: "#9e9e9e",
    icon: Circle,
  },
};

export const getPlatformMeta = (platform: MessagingPlatform) =>
  PLATFORM_META[platform] ?? PLATFORM_META.unknown;
