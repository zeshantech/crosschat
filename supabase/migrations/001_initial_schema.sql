-- CrossChat Database Schema
-- This migration creates the complete database schema for the Cross-Platform Inbox SaaS

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. BUSINESSES TABLE
-- Multi-tenant business accounts
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Plan & Billing
  plan_type VARCHAR(50) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  subscription_id VARCHAR(255), -- Stripe subscription ID
  subscription_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),

  -- Settings
  settings JSONB DEFAULT '{
    "timezone": "UTC",
    "working_hours": {
      "enabled": true,
      "schedule": {
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"},
        "wednesday": {"start": "09:00", "end": "17:00"},
        "thursday": {"start": "09:00", "end": "17:00"},
        "friday": {"start": "09:00", "end": "17:00"},
        "saturday": {"start": "09:00", "end": "13:00"},
        "sunday": {"start": "closed", "end": "closed"}
      }
    },
    "auto_assignment": {
      "enabled": true,
      "type": "round_robin",
      "fallback_to_ai": false
    },
    "notifications": {
      "email": true,
      "desktop": true,
      "sound": true
    }
  }'::jsonb,

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_subscription_status ON businesses(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_businesses_plan_type ON businesses(plan_type);

-- 2. USERS TABLE
-- User accounts linked to Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,

  -- User preferences
  preferences JSONB DEFAULT '{
    "theme": "light",
    "notifications": {
      "desktop": true,
      "sound": true,
      "email": true
    },
    "keyboard_shortcuts": true,
    "language": "en"
  }'::jsonb,

  -- Status
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 3. TEAM MEMBERS TABLE
-- Links users to businesses with roles
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role & Permissions
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'limited_agent')),
  permissions JSONB DEFAULT '{
    "conversations": {
      "view_all": true,
      "view_assigned": true,
      "reply": true,
      "assign": false,
      "close": true
    },
    "customers": {
      "view": true,
      "edit": true,
      "delete": false
    },
    "team": {
      "view": true,
      "invite": false,
      "edit": false,
      "remove": false
    },
    "settings": {
      "view": false,
      "edit": false
    },
    "billing": {
      "view": false,
      "edit": false
    }
  }'::jsonb,

  -- Team organization
  department VARCHAR(100),
  title VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, user_id)
);

CREATE INDEX idx_team_members_business ON team_members(business_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_active ON team_members(is_active) WHERE is_active = true;

-- 4. CUSTOMERS TABLE
-- Unified customer profiles
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Identity
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,

  -- Platform identifiers
  platform_identifiers JSONB DEFAULT '{
    "whatsapp": null,
    "instagram": null,
    "facebook": null,
    "twitter": null,
    "telegram": null,
    "email": null,
    "widget": null
  }'::jsonb,

  -- Customer data
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,

  -- CRM fields
  customer_since TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  total_conversations INTEGER DEFAULT 0,

  -- Sentiment tracking
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_business ON customers(business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
CREATE INDEX idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);

-- 5. CONVERSATIONS TABLE
-- Individual conversation threads
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Channel information
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'whatsapp', 'instagram', 'facebook', 'twitter', 'telegram',
    'email', 'widget', 'voice_call', 'sms'
  )),
  platform_conversation_id VARCHAR(255),

  -- Status & Assignment
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed', 'archived')),
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  assigned_type VARCHAR(50) DEFAULT 'unassigned' CHECK (assigned_type IN ('unassigned', 'ai_bot', 'team_member', 'round_robin')),

  -- Conversation metadata
  subject VARCHAR(500),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metrics
  first_response_time INTEGER, -- seconds
  resolution_time INTEGER, -- seconds
  total_messages INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,

  -- Timestamps
  last_message_at TIMESTAMPTZ,
  last_customer_message_at TIMESTAMPTZ,
  last_agent_message_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_business ON conversations(business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_business_status ON conversations(business_id, status) WHERE deleted_at IS NULL;

-- 6. MESSAGES TABLE
-- Individual messages within conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender information
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'ai_bot')),
  sender_id UUID, -- user_id for agents, customer_id for customers
  sender_name VARCHAR(255),

  -- Message content
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN (
    'text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'sticker'
  )),

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Platform metadata
  platform VARCHAR(50) NOT NULL,
  platform_message_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Message metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  is_internal_note BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX idx_messages_platform_id ON messages(platform_message_id) WHERE platform_message_id IS NOT NULL;
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 7. PLATFORM INTEGRATIONS TABLE
-- Store platform credentials and configuration
CREATE TABLE platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Platform details
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'whatsapp', 'instagram', 'facebook', 'twitter', 'telegram',
    'gmail', 'outlook', 'imap', 'widget', 'twilio_voice'
  )),
  platform_account_id VARCHAR(255),
  platform_account_name VARCHAR(255),

  -- Authentication (should be encrypted in production)
  credentials JSONB NOT NULL,
  webhook_url TEXT,
  webhook_secret VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(50) DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'paused', 'disconnected')),

  -- Configuration
  config JSONB DEFAULT '{
    "auto_reply": false,
    "greeting_message": null,
    "business_hours_only": false
  }'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, platform, platform_account_id)
);

CREATE INDEX idx_platform_integrations_business ON platform_integrations(business_id);
CREATE INDEX idx_platform_integrations_platform ON platform_integrations(platform);
CREATE INDEX idx_platform_integrations_active ON platform_integrations(is_active) WHERE is_active = true;

-- 8. NOTIFICATIONS TABLE
-- Real-time notifications for users
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  -- Notification details
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_message', 'conversation_assigned', 'mention',
    'conversation_resolved', 'team_invite', 'system'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT,

  -- Action
  action_url TEXT,
  action_label VARCHAR(100),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status
  read_status BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_read_status ON notifications(user_id, read_status) WHERE read_status = false;

-- 9. AI CHATBOTS TABLE
-- AI chatbot configuration
CREATE TABLE ai_chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Bot details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Configuration
  model_provider VARCHAR(50) DEFAULT 'openai' CHECK (model_provider IN ('openai', 'anthropic', 'custom')),
  model_name VARCHAR(100) DEFAULT 'gpt-4',

  -- Training data
  knowledge_base TEXT,
  training_documents TEXT[],
  faq_data JSONB DEFAULT '[]'::jsonb,

  -- Behavior
  personality VARCHAR(50) DEFAULT 'professional' CHECK (personality IN ('professional', 'friendly', 'casual', 'formal')),
  tone VARCHAR(50) DEFAULT 'helpful',
  language VARCHAR(10) DEFAULT 'en',

  -- Rules
  escalation_rules JSONB DEFAULT '{
    "keywords": ["human", "agent", "speak to someone"],
    "sentiment_threshold": -0.5,
    "unresolved_after_messages": 5
  }'::jsonb,

  auto_greeting BOOLEAN DEFAULT true,
  greeting_message TEXT DEFAULT 'Hi! How can I help you today?',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_chatbots_business ON ai_chatbots(business_id);
CREATE INDEX idx_ai_chatbots_active ON ai_chatbots(is_active) WHERE is_active = true;

-- 10. SUBSCRIPTION PLANS TABLE
-- Plan definitions
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan details
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Limits
  limits JSONB DEFAULT '{
    "team_members": 1,
    "conversations_per_month": 100,
    "integrations": ["email", "widget"],
    "ai_messages_per_month": 0,
    "storage_gb": 1,
    "api_calls_per_month": 1000
  }'::jsonb,

  -- Features
  features JSONB DEFAULT '{
    "unified_inbox": true,
    "team_collaboration": false,
    "ai_chatbot": false,
    "advanced_routing": false,
    "analytics": "basic",
    "api_access": false,
    "custom_branding": false,
    "priority_support": false
  }'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- 11. WEBHOOKS TABLE
-- Outgoing webhooks for custom integrations
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Webhook configuration
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255),

  -- Events to listen to
  events TEXT[] NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,

  -- Retry configuration
  retry_config JSONB DEFAULT '{
    "max_attempts": 3,
    "backoff_multiplier": 2
  }'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_business ON webhooks(business_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON platform_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_chatbots_updated_at BEFORE UPDATE ON ai_chatbots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment conversation message count
CREATE OR REPLACE FUNCTION increment_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    total_messages = total_messages + 1,
    last_message_at = NEW.created_at,
    last_customer_message_at = CASE
      WHEN NEW.sender_type = 'customer' THEN NEW.created_at
      ELSE last_customer_message_at
    END,
    last_agent_message_at = CASE
      WHEN NEW.sender_type = 'agent' THEN NEW.created_at
      ELSE last_agent_message_at
    END,
    unread_count = CASE
      WHEN NEW.sender_type = 'customer' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_message_count AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_conversation_message_count();

-- Update customer last_contact_at
CREATE OR REPLACE FUNCTION update_customer_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET last_contact_at = NEW.created_at
  WHERE id = (SELECT customer_id FROM conversations WHERE id = NEW.conversation_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_contact AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_customer_last_contact();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's businesses
CREATE OR REPLACE FUNCTION get_user_businesses(user_uuid UUID)
RETURNS TABLE(business_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT tm.business_id
  FROM team_members tm
  WHERE tm.user_id = user_uuid AND tm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is business member
CREATE OR REPLACE FUNCTION is_business_member(user_uuid UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = user_uuid
    AND business_id = biz_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Users: Can view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Businesses: Users can only see businesses they're part of
CREATE POLICY "Users can view their businesses" ON businesses
  FOR SELECT
  USING (id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can update their businesses" ON businesses
  FOR UPDATE
  USING (id IN (SELECT get_user_businesses(auth.uid())));

-- Team members: Users can see team members in their businesses
CREATE POLICY "Users can view team members in their businesses" ON team_members
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can insert team members" ON team_members
  FOR INSERT
  WITH CHECK (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Customers: Users can see customers in their businesses
CREATE POLICY "Users can view customers in their businesses" ON customers
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can manage customers in their businesses" ON customers
  FOR ALL
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Conversations: Users can see conversations in their businesses
CREATE POLICY "Users can view conversations in their businesses" ON conversations
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can manage conversations in their businesses" ON conversations
  FOR ALL
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Messages: Users can see messages in their business conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE c.business_id IN (SELECT get_user_businesses(auth.uid()))
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      WHERE c.business_id IN (SELECT get_user_businesses(auth.uid()))
    )
  );

-- Platform Integrations: Users can manage integrations in their businesses
CREATE POLICY "Users can view integrations in their businesses" ON platform_integrations
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can manage integrations in their businesses" ON platform_integrations
  FOR ALL
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- AI Chatbots: Users can manage chatbots in their businesses
CREATE POLICY "Users can view chatbots in their businesses" ON ai_chatbots
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can manage chatbots in their businesses" ON ai_chatbots
  FOR ALL
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Webhooks: Users can manage webhooks in their businesses
CREATE POLICY "Users can view webhooks in their businesses" ON webhooks
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

CREATE POLICY "Users can manage webhooks in their businesses" ON webhooks
  FOR ALL
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Subscription plans: Everyone can view active plans
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- SEED DATA - Default subscription plans
-- ============================================================================

INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, limits, features) VALUES
(
  'Starter',
  'starter',
  'Perfect for small teams getting started with unified inbox',
  19.99,
  199.00,
  '{
    "team_members": 1,
    "conversations_per_month": 500,
    "integrations": ["email", "widget"],
    "ai_messages_per_month": 0,
    "storage_gb": 2,
    "api_calls_per_month": 1000
  }'::jsonb,
  '{
    "unified_inbox": true,
    "team_collaboration": false,
    "ai_chatbot": false,
    "advanced_routing": false,
    "analytics": "basic",
    "api_access": false,
    "custom_branding": false,
    "priority_support": false
  }'::jsonb
),
(
  'Professional',
  'professional',
  'For growing teams that need AI and advanced features',
  49.99,
  499.00,
  '{
    "team_members": 5,
    "conversations_per_month": 2000,
    "integrations": ["whatsapp", "instagram", "facebook", "email", "widget", "telegram"],
    "ai_messages_per_month": 1000,
    "storage_gb": 10,
    "api_calls_per_month": 10000
  }'::jsonb,
  '{
    "unified_inbox": true,
    "team_collaboration": true,
    "ai_chatbot": true,
    "advanced_routing": true,
    "analytics": "advanced",
    "api_access": true,
    "custom_branding": false,
    "priority_support": false
  }'::jsonb
),
(
  'Business',
  'business',
  'For businesses that need unlimited power and customization',
  99.99,
  999.00,
  '{
    "team_members": -1,
    "conversations_per_month": -1,
    "integrations": ["all"],
    "ai_messages_per_month": -1,
    "storage_gb": 100,
    "api_calls_per_month": -1
  }'::jsonb,
  '{
    "unified_inbox": true,
    "team_collaboration": true,
    "ai_chatbot": true,
    "advanced_routing": true,
    "analytics": "enterprise",
    "api_access": true,
    "custom_branding": true,
    "priority_support": true
  }'::jsonb
);

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
