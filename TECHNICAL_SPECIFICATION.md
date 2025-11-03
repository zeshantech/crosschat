# Cross-Platform Inbox SaaS - Technical Specification

## Project Overview

**CrossChat** is a unified inbox SaaS platform that consolidates customer communications from multiple channels into a single, intuitive dashboard. Designed for small to medium businesses, it serves as a centralized hub for managing all customer interactions across social media, email, chat, and voice calls.

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: React Hooks + Supabase Realtime
- **Authentication**: Supabase Auth with SSR
- **Real-time**: Supabase Realtime subscriptions
- **Forms**: React Hook Form + Yup validation
- **Notifications**: Sonner toasts + Browser Notifications API

### Backend
- **Framework**: NestJS 11
- **Database**: Supabase (PostgreSQL 15+)
- **Real-time**: Supabase Realtime Extension
- **Authentication**: Supabase Auth + NestJS Passport JWT
- **File Storage**: Supabase Storage
- **API Style**: RESTful + WebSocket (via Supabase)
- **Validation**: class-validator + class-transformer

### Infrastructure & Services
- **Database**: Supabase PostgreSQL
- **Real-time Engine**: Supabase Realtime (PostgreSQL LISTEN/NOTIFY)
- **Storage**: Supabase Storage (S3-compatible)
- **Auth Provider**: Supabase Auth (OAuth + JWT)
- **Payment Gateways**: Stripe + PayFast
- **Email Service**: SendGrid / AWS SES
- **SMS/WhatsApp**: Twilio
- **VoIP**: Twilio Voice / Plivo
- **Push Notifications**: Firebase Cloud Messaging (optional)

### Platform Integrations
- **Social Media**: Meta Business API (Instagram, Facebook, WhatsApp Business), Twitter API v2, Telegram Bot API
- **Email**: Gmail API, Microsoft Graph API, IMAP/SMTP
- **Custom**: Embedded chat widget (JavaScript SDK)

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Dashboard)                                   │
│  - React Components (shadcn/ui)                                 │
│  - Supabase Client (SSR)                                        │
│  - Real-time Subscriptions                                      │
│  - WebSocket Connections                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS/WSS
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                      API Gateway Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  NestJS Backend                                                  │
│  - REST API Controllers                                          │
│  - Authentication Guards                                         │
│  - Business Logic Services                                       │
│  - Integration Services                                          │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ PostgreSQL Protocol / REST
             │
┌────────────▼────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Platform                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │  PostgreSQL  │ │   Realtime   │ │   Storage    │           │
│  │   Database   │ │    Engine    │ │    Bucket    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌──────────────┐                             │
│  │     Auth     │ │  Edge Funcs  │                             │
│  │   Service    │ │   (optional) │                             │
│  └──────────────┘ └──────────────┘                             │
└────────────────────────────────────────────────────────────────┘
             │
             │ External APIs
             │
┌────────────▼────────────────────────────────────────────────────┐
│                   External Services                              │
├─────────────────────────────────────────────────────────────────┤
│  - Meta Business API (WhatsApp, Instagram, Facebook)            │
│  - Twitter API                                                   │
│  - Telegram Bot API                                              │
│  - Gmail API / Microsoft Graph                                   │
│  - Twilio (Voice, SMS, WhatsApp)                                │
│  - Stripe / PayFast                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Real-time Data Flow

```
External Platform → Webhook → NestJS → Supabase DB → Realtime → Frontend
                                             ↓
                                       Broadcast to all
                                       connected clients
```

## Database Schema

### Core Tables

#### 1. businesses
Primary table for multi-tenant business accounts.

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Plan & Billing
  plan_type VARCHAR(50) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  subscription_id VARCHAR(255), -- Stripe subscription ID
  subscription_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

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
CREATE INDEX idx_businesses_subscription_status ON businesses(subscription_status);
```

#### 2. users
User accounts (linked to Supabase Auth).

```sql
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
    "keyboard_shortcuts": true
  }'::jsonb,

  -- Status
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. team_members
Links users to businesses with roles and permissions.

```sql
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
```

#### 4. customers
Unified customer profiles across all channels.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Identity
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,

  -- Platform identifiers (store platform-specific IDs)
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
  satisfaction_rating INTEGER, -- 1-5

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
```

#### 5. conversations
Individual conversation threads.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Channel information
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'whatsapp', 'instagram', 'facebook', 'twitter', 'telegram',
    'email', 'widget', 'voice_call', 'sms'
  )),
  platform_conversation_id VARCHAR(255), -- External platform's conversation ID

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

CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

#### 6. messages
Individual messages within conversations.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender information
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'ai_bot')),
  sender_id UUID, -- References user_id for agents, customer_id for customers
  sender_name VARCHAR(255),

  -- Message content
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN (
    'text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'sticker'
  )),

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- [{url, type, size, name}]

  -- Platform metadata
  platform VARCHAR(50) NOT NULL,
  platform_message_id VARCHAR(255), -- External platform's message ID

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
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_platform_id ON messages(platform_message_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

#### 7. platform_integrations
Store platform credentials and configuration.

```sql
CREATE TABLE platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Platform details
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'whatsapp', 'instagram', 'facebook', 'twitter', 'telegram',
    'gmail', 'outlook', 'imap', 'widget', 'twilio_voice'
  )),
  platform_account_id VARCHAR(255), -- Platform's account identifier
  platform_account_name VARCHAR(255),

  -- Authentication (encrypted in production)
  credentials JSONB NOT NULL, -- Stores tokens, secrets, etc.
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
```

#### 8. notifications
Real-time notifications for users.

```sql
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
CREATE INDEX idx_notifications_read_status ON notifications(user_id, read_status);
```

#### 9. ai_chatbots
AI chatbot configuration.

```sql
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
```

#### 10. subscription_plans
Plan definitions.

```sql
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
```

#### 11. webhooks
Outgoing webhooks for custom integrations.

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Webhook configuration
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255),

  -- Events to listen to
  events TEXT[] NOT NULL, -- ['message.created', 'conversation.assigned', etc.]

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
```

### Database Functions & Triggers

#### Auto-update updated_at timestamp

```sql
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
```

#### Increment conversation message count

```sql
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
```

## Row Level Security (RLS) Policies

### Enable RLS on all tables

```sql
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
```

### RLS Policies

```sql
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

-- Businesses: Users can only see businesses they're part of
CREATE POLICY "Users can view their businesses" ON businesses
  FOR SELECT
  USING (id IN (SELECT get_user_businesses(auth.uid())));

-- Team members: Users can see team members in their businesses
CREATE POLICY "Users can view team members in their businesses" ON team_members
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Conversations: Users can see conversations in their businesses
CREATE POLICY "Users can view conversations in their businesses" ON conversations
  FOR SELECT
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

-- Customers: Users can see customers in their businesses
CREATE POLICY "Users can view customers in their businesses" ON customers
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());
```

## API Architecture

### NestJS Module Structure

```
src/
├── app.module.ts                    # Root module
├── main.ts                          # Bootstrap file
├── common/                          # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── auth/                            # Authentication
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── strategies/
│   │   └── supabase.strategy.ts
│   └── guards/
│       └── auth.guard.ts
├── businesses/                      # Business management
│   ├── businesses.module.ts
│   ├── businesses.service.ts
│   ├── businesses.controller.ts
│   └── dto/
├── team/                            # Team member management
│   ├── team.module.ts
│   ├── team.service.ts
│   ├── team.controller.ts
│   └── dto/
├── customers/                       # Customer management
│   ├── customers.module.ts
│   ├── customers.service.ts
│   ├── customers.controller.ts
│   └── dto/
├── conversations/                   # Conversation management
│   ├── conversations.module.ts
│   ├── conversations.service.ts
│   ├── conversations.controller.ts
│   └── dto/
├── messages/                        # Message handling
│   ├── messages.module.ts
│   ├── messages.service.ts
│   ├── messages.controller.ts
│   └── dto/
├── integrations/                    # Platform integrations
│   ├── integrations.module.ts
│   ├── whatsapp/
│   │   ├── whatsapp.service.ts
│   │   ├── whatsapp.controller.ts
│   │   └── whatsapp.webhook.ts
│   ├── instagram/
│   ├── facebook/
│   ├── twitter/
│   ├── telegram/
│   ├── email/
│   └── widget/
├── ai/                             # AI chatbot
│   ├── ai.module.ts
│   ├── ai.service.ts
│   ├── ai.controller.ts
│   └── providers/
│       ├── openai.provider.ts
│       └── anthropic.provider.ts
├── notifications/                   # Notification system
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── notifications.gateway.ts
│   └── dto/
├── payments/                        # Payment & subscriptions
│   ├── payments.module.ts
│   ├── stripe/
│   │   ├── stripe.service.ts
│   │   ├── stripe.controller.ts
│   │   └── stripe.webhook.ts
│   └── payfast/
│       ├── payfast.service.ts
│       └── payfast.controller.ts
├── analytics/                       # Analytics & reporting
│   ├── analytics.module.ts
│   ├── analytics.service.ts
│   └── analytics.controller.ts
├── realtime/                        # Real-time service
│   ├── realtime.module.ts
│   └── realtime.service.ts
└── storage/                         # File storage
    ├── storage.module.ts
    ├── storage.service.ts
    └── storage.controller.ts
```

### REST API Endpoints

#### Authentication
```
POST   /auth/signup                  # Register new user
POST   /auth/login                   # Login with email/password
POST   /auth/logout                  # Logout
POST   /auth/refresh                 # Refresh access token
GET    /auth/me                      # Get current user
POST   /auth/forgot-password         # Request password reset
POST   /auth/reset-password          # Reset password
```

#### Businesses
```
POST   /businesses                   # Create new business
GET    /businesses                   # List user's businesses
GET    /businesses/:id               # Get business details
PATCH  /businesses/:id               # Update business
DELETE /businesses/:id               # Delete business
PATCH  /businesses/:id/settings      # Update business settings
```

#### Team Members
```
POST   /businesses/:id/team          # Invite team member
GET    /businesses/:id/team          # List team members
GET    /businesses/:id/team/:memberId # Get team member
PATCH  /businesses/:id/team/:memberId # Update team member
DELETE /businesses/:id/team/:memberId # Remove team member
PATCH  /businesses/:id/team/:memberId/role # Update role
```

#### Customers
```
POST   /customers                    # Create customer
GET    /customers                    # List customers (with filters)
GET    /customers/:id                # Get customer details
PATCH  /customers/:id                # Update customer
DELETE /customers/:id                # Delete customer
GET    /customers/:id/conversations  # Get customer conversations
POST   /customers/:id/notes          # Add customer note
POST   /customers/:id/tags           # Add tags
```

#### Conversations
```
POST   /conversations                # Create conversation
GET    /conversations                # List conversations (with filters)
GET    /conversations/:id            # Get conversation details
PATCH  /conversations/:id            # Update conversation
DELETE /conversations/:id            # Delete conversation
POST   /conversations/:id/assign     # Assign conversation
PATCH  /conversations/:id/status     # Update status
POST   /conversations/:id/tags       # Add tags
GET    /conversations/:id/messages   # Get conversation messages
```

#### Messages
```
POST   /messages                     # Send message
GET    /messages/:id                 # Get message details
PATCH  /messages/:id                 # Update message
DELETE /messages/:id                 # Delete message
POST   /messages/:id/read            # Mark as read
```

#### Platform Integrations
```
POST   /integrations/:platform/connect    # Connect platform
GET    /integrations                      # List integrations
GET    /integrations/:id                  # Get integration details
PATCH  /integrations/:id                  # Update integration
DELETE /integrations/:id                  # Disconnect platform
POST   /integrations/:platform/webhook    # Webhook endpoint
```

#### AI Chatbot
```
POST   /ai/chatbots                  # Create chatbot
GET    /ai/chatbots                  # List chatbots
GET    /ai/chatbots/:id              # Get chatbot details
PATCH  /ai/chatbots/:id              # Update chatbot
DELETE /ai/chatbots/:id              # Delete chatbot
POST   /ai/chatbots/:id/train        # Train chatbot
POST   /ai/chat                      # Chat with AI (internal)
```

#### Notifications
```
GET    /notifications                # List notifications
GET    /notifications/:id            # Get notification
PATCH  /notifications/:id/read       # Mark as read
PATCH  /notifications/read-all       # Mark all as read
DELETE /notifications/:id            # Delete notification
```

#### Payments
```
GET    /payments/plans               # List subscription plans
POST   /payments/subscribe           # Subscribe to plan
POST   /payments/update-subscription # Update subscription
POST   /payments/cancel-subscription # Cancel subscription
GET    /payments/invoices            # List invoices
POST   /payments/stripe/webhook      # Stripe webhook
POST   /payments/payfast/webhook     # PayFast webhook
```

#### Analytics
```
GET    /analytics/overview           # Business overview stats
GET    /analytics/conversations      # Conversation metrics
GET    /analytics/team               # Team performance
GET    /analytics/channels           # Channel performance
GET    /analytics/customers          # Customer insights
```

## Real-time Implementation with Supabase

### Supabase Realtime Configuration

Supabase Realtime uses PostgreSQL's LISTEN/NOTIFY feature to broadcast changes to subscribed clients.

#### Enable Realtime on Tables

```sql
-- Enable realtime for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
```

### Frontend Real-time Subscriptions

#### 1. New Messages Real-time

```typescript
// hooks/useRealtimeMessages.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeMessages(conversationId: string) {
  const [messages, setMessages] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])

          // Play notification sound
          if (payload.new.sender_type === 'customer') {
            playNotificationSound()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => msg.id === payload.new.id ? payload.new : msg)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return messages
}
```

#### 2. Conversation List Real-time

```typescript
// hooks/useRealtimeConversations.ts
export function useRealtimeConversations(businessId: string) {
  const [conversations, setConversations] = useState([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`business:${businessId}:conversations`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((conv) => conv.id === payload.new.id ? payload.new : conv)
            )
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) =>
              prev.filter((conv) => conv.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId])

  return conversations
}
```

#### 3. Team Presence (Online/Offline Status)

```typescript
// hooks/usePresence.ts
export function usePresence(businessId: string) {
  const [onlineMembers, setOnlineMembers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`presence:${businessId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state)
        setOnlineMembers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            status: 'online'
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId])

  return onlineMembers
}
```

#### 4. Typing Indicators

```typescript
// hooks/useTypingIndicator.ts
export function useTypingIndicator(conversationId: string, userId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase = createClient()

  const startTyping = () => {
    const channel = supabase.channel(`typing:${conversationId}`)
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: true }
    })
  }

  const stopTyping = () => {
    const channel = supabase.channel(`typing:${conversationId}`)
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping: false }
    })
  }

  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setTypingUsers((prev) =>
            payload.isTyping
              ? [...prev, payload.userId]
              : prev.filter((id) => id !== payload.userId)
          )

          // Auto-remove after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== payload.userId))
          }, 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return { typingUsers, startTyping, stopTyping }
}
```

### Backend Real-time Integration

The NestJS backend primarily interacts with Supabase using the REST API. Real-time updates happen automatically through PostgreSQL triggers and Supabase Realtime broadcasts.

```typescript
// realtime/realtime.service.ts
import { Injectable } from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class RealtimeService {
  constructor(private supabase: SupabaseClient) {}

  // Broadcast a custom event
  async broadcastEvent(channel: string, event: string, payload: any) {
    await this.supabase
      .channel(channel)
      .send({
        type: 'broadcast',
        event,
        payload
      })
  }

  // Send notification to specific user
  async notifyUser(userId: string, notification: any) {
    await this.supabase.from('notifications').insert({
      user_id: userId,
      ...notification
    })
    // Notification will be automatically broadcast via Realtime
  }
}
```

## Frontend Component Architecture

### Dashboard Layout Structure

```
Dashboard
├── Sidebar (Left)
│   ├── BusinessSwitcher
│   ├── NavigationMenu
│   │   ├── Inbox (with unread badge)
│   │   ├── Customers
│   │   ├── Team
│   │   ├── Analytics
│   │   └── Settings
│   └── UserMenu
├── Main Content Area
│   ├── InboxView
│   │   ├── ConversationList (Middle)
│   │   │   ├── SearchBar
│   │   │   ├── FilterTabs (All, Unassigned, Mine, etc.)
│   │   │   └── ConversationItem[] (with unread count, last message)
│   │   ├── ConversationThread (Center)
│   │   │   ├── ConversationHeader (customer info, status, assign)
│   │   │   ├── MessageList (scrollable, real-time)
│   │   │   │   └── Message (text, image, file, timestamp, status)
│   │   │   └── MessageInput (text, attachments, emoji)
│   │   └── CustomerSidebar (Right)
│   │       ├── CustomerProfile
│   │       ├── ConversationInfo
│   │       ├── Tags
│   │       ├── Notes
│   │       └── History
│   ├── CustomersView
│   ├── TeamView
│   ├── AnalyticsView
│   └── SettingsView
└── TopBar
    ├── Search
    ├── NotificationBell (with badge)
    ├── ThemeToggle
    └── UserAvatar
```

### Key Components

#### Inbox Components
- `ConversationList.tsx` - List of conversations with filters
- `ConversationItem.tsx` - Individual conversation preview
- `ConversationThread.tsx` - Message thread view
- `Message.tsx` - Individual message component
- `MessageInput.tsx` - Compose message with attachments
- `CustomerSidebar.tsx` - Customer info panel
- `AssignmentDialog.tsx` - Assign conversation to agent/AI
- `PlatformBadge.tsx` - Platform indicator (WhatsApp, Instagram, etc.)

#### Customer Components
- `CustomerList.tsx` - Customer directory
- `CustomerProfile.tsx` - Customer details
- `CustomerHistory.tsx` - Interaction timeline
- `CustomerNotes.tsx` - Internal notes
- `CustomerTags.tsx` - Tag management

#### Team Components
- `TeamList.tsx` - Team member list
- `TeamMemberCard.tsx` - Member info card
- `InviteDialog.tsx` - Invite new member
- `RoleManager.tsx` - Edit roles and permissions
- `OnlineStatus.tsx` - Real-time presence indicator

#### Integration Components
- `IntegrationList.tsx` - Connected platforms
- `IntegrationCard.tsx` - Platform connection card
- `ConnectDialog.tsx` - Platform connection flow
- `WhatsAppConnect.tsx` - WhatsApp-specific setup
- `EmailConnect.tsx` - Email IMAP setup
- `WidgetCustomizer.tsx` - Chat widget appearance editor

### Component Example: ConversationThread

```typescript
// components/inbox/conversation-thread.tsx
'use client'

import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { Message } from './message'
import { MessageInput } from './message-input'
import { ConversationHeader } from './conversation-header'

export function ConversationThread({ conversationId }: { conversationId: string }) {
  const messages = useRealtimeMessages(conversationId)
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader conversationId={conversationId} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {typingUsers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {typingUsers.length} {typingUsers.length === 1 ? 'person is' : 'people are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        conversationId={conversationId}
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />
    </div>
  )
}
```

## Platform Integration Guides

### 1. WhatsApp Business API Integration

**Requirements:**
- Meta Business Account
- WhatsApp Business API access
- Verified phone number

**Setup Flow:**
1. Connect to Meta Business API
2. Get access token and phone number ID
3. Set up webhook for incoming messages
4. Subscribe to message events

**NestJS Implementation:**

```typescript
// integrations/whatsapp/whatsapp.service.ts
@Injectable()
export class WhatsAppService {
  private readonly apiUrl = 'https://graph.facebook.com/v18.0'

  async sendMessage(to: string, message: string, token: string) {
    const response = await fetch(`${this.apiUrl}/{phone-number-id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      })
    })
    return response.json()
  }

  async handleWebhook(payload: any) {
    // Process incoming WhatsApp messages
    const { entry } = payload
    for (const item of entry) {
      for (const change of item.changes) {
        if (change.field === 'messages') {
          const { messages } = change.value
          for (const message of messages) {
            await this.processIncomingMessage(message)
          }
        }
      }
    }
  }
}
```

### 2. Instagram Direct Integration

Uses Meta Graph API with Instagram messaging permissions.

```typescript
// integrations/instagram/instagram.service.ts
@Injectable()
export class InstagramService {
  async sendMessage(recipientId: string, message: string, pageAccessToken: string) {
    const response = await fetch(
      'https://graph.facebook.com/v18.0/me/messages',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pageAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        })
      }
    )
    return response.json()
  }
}
```

### 3. Email Integration (IMAP)

```typescript
// integrations/email/email.service.ts
import Imap from 'imap'
import { simpleParser } from 'mailparser'

@Injectable()
export class EmailService {
  async connectImap(config: ImapConfig) {
    const imap = new Imap({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: true
    })

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) throw err

        // Listen for new emails
        imap.on('mail', () => {
          this.fetchNewEmails(imap)
        })
      })
    })

    imap.connect()
  }

  async fetchNewEmails(imap: Imap) {
    // Fetch and process new emails
  }
}
```

### 4. Telegram Bot Integration

```typescript
// integrations/telegram/telegram.service.ts
import TelegramBot from 'node-telegram-bot-api'

@Injectable()
export class TelegramService {
  private bot: TelegramBot

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
    this.setupMessageHandler()
  }

  setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      await this.processIncomingMessage(msg)
    })
  }

  async sendMessage(chatId: string, text: string) {
    await this.bot.sendMessage(chatId, text)
  }
}
```

### 5. Embedded Chat Widget

**Widget SDK (JavaScript):**

```javascript
// public/widget.js
(function() {
  window.CrossChat = {
    init: function(config) {
      // Create iframe
      const iframe = document.createElement('iframe')
      iframe.src = `https://widget.crosschat.com?business=${config.businessId}`
      iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;'
      document.body.appendChild(iframe)

      // Listen for messages from widget
      window.addEventListener('message', (event) => {
        if (event.data.type === 'CROSSCHAT_MESSAGE') {
          // Send to backend via API
        }
      })
    }
  }
})()
```

**Usage:**
```html
<script src="https://cdn.crosschat.com/widget.js"></script>
<script>
  CrossChat.init({
    businessId: 'your-business-id',
    theme: 'light',
    position: 'bottom-right'
  })
</script>
```

## Payment Integration

### Stripe Integration

```typescript
// payments/stripe/stripe.service.ts
import Stripe from 'stripe'

@Injectable()
export class StripeService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })
  }

  async createSubscription(customerId: string, priceId: string) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    })

    return subscription
  }

  async handleWebhook(signature: string, payload: string) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object)
        break
    }
  }
}
```

### PayFast Integration (South African Market)

```typescript
// payments/payfast/payfast.service.ts
@Injectable()
export class PayFastService {
  async createPayment(data: PaymentData) {
    // Generate payment request
    const paymentData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      amount: data.amount,
      item_name: data.description,
      return_url: `${process.env.APP_URL}/payments/success`,
      cancel_url: `${process.env.APP_URL}/payments/cancelled`,
      notify_url: `${process.env.API_URL}/payments/payfast/webhook`
    }

    const signature = this.generateSignature(paymentData)
    return { ...paymentData, signature }
  }

  async handleWebhook(payload: any) {
    // Verify signature and process payment notification
  }
}
```

## Security Implementation

### Authentication Flow

1. **User Registration/Login** → Supabase Auth
2. **JWT Token Generation** → Supabase
3. **Token Validation** → NestJS Guard
4. **RLS Policies** → Supabase Database

### NestJS Auth Guard

```typescript
// common/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      )

      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        throw new UnauthorizedException()
      }

      request.user = user
      return true
    } catch {
      throw new UnauthorizedException()
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler())

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user
    const businessId = request.params.businessId || request.body.businessId

    // Fetch user's role in this business
    const { data: member } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()

    return requiredRoles.includes(member?.role)
  }
}
```

### Usage in Controllers

```typescript
@Controller('conversations')
@UseGuards(AuthGuard, RolesGuard)
export class ConversationsController {
  @Get()
  @Roles('owner', 'admin', 'manager', 'agent')
  async findAll(@CurrentUser() user: User) {
    // Only authenticated users with specified roles can access
  }

  @Post()
  @Roles('owner', 'admin', 'manager')
  async create(@Body() createDto: CreateConversationDto) {
    // Only managers and above can create
  }
}
```

## Performance Optimization

### Database Optimization

1. **Indexes** - All foreign keys and frequently queried columns
2. **Partitioning** - Messages table partitioned by date for large datasets
3. **Connection Pooling** - Supabase handles this automatically
4. **Read Replicas** - For high-traffic scenarios (Supabase Pro)

### Frontend Optimization

1. **Code Splitting** - Next.js automatic code splitting
2. **Lazy Loading** - Lazy load heavy components
3. **Virtual Scrolling** - For long conversation/message lists
4. **Image Optimization** - Next.js Image component
5. **Caching** - React Query / SWR for API data

### Real-time Optimization

1. **Channel Cleanup** - Unsubscribe from channels when unmounting
2. **Throttling** - Throttle typing indicators
3. **Batching** - Batch multiple database updates
4. **Selective Subscriptions** - Only subscribe to active conversation

## Deployment Architecture

### Recommended Stack

```
Domain → Vercel (Frontend) → Supabase (Backend + DB)
                          ↓
                   Railway/Render (NestJS API)
                          ↓
                   External APIs (WhatsApp, Stripe, etc.)
```

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

**Backend (.env):**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=

# Integrations
META_APP_ID=
META_APP_SECRET=
TWITTER_API_KEY=
TELEGRAM_BOT_TOKEN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
```

## User Onboarding Flow

### Step 1: Authentication
- OAuth with Google/Facebook/GitHub
- Email/password signup

### Step 2: Business Setup
- Business name, industry
- Team size
- Timezone, working hours

### Step 3: Platform Connection
- Choose platforms to connect
- Guided connection flow for each
- Test connection

### Step 4: Team Invitation
- Invite team members
- Assign roles
- Send invitation emails

### Step 5: Payment
- Choose subscription plan
- Enter payment details
- Start trial or activate

### Step 6: First Conversation
- Interactive tutorial
- Sample conversation
- Guide through features

## Success Metrics & Analytics

### Key Metrics to Track

1. **Response Time**
   - First response time
   - Average response time
   - Response time by channel

2. **Resolution Metrics**
   - Average resolution time
   - First contact resolution rate
   - Reopened conversations

3. **Team Performance**
   - Conversations handled per agent
   - Customer satisfaction per agent
   - Online time

4. **Channel Performance**
   - Messages per channel
   - Response rate per channel
   - Customer preference

5. **Business Metrics**
   - Total conversations
   - Active customers
   - Growth trends
   - Churn rate

## Development Phases

### Phase 1: MVP (4-6 weeks)
- [ ] Database schema setup
- [ ] Authentication system
- [ ] Basic inbox UI
- [ ] 2 platform integrations (Email + Widget)
- [ ] Real-time messaging
- [ ] Team management
- [ ] Manual assignment

### Phase 2: Core Features (4-6 weeks)
- [ ] All platform integrations
- [ ] AI chatbot integration
- [ ] Smart routing
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Notification system

### Phase 3: Advanced Features (4-6 weeks)
- [ ] Call functionality (VoIP)
- [ ] Advanced automation
- [ ] Custom workflows
- [ ] API access
- [ ] Mobile app
- [ ] Advanced analytics

## Conclusion

This technical specification provides a comprehensive blueprint for building CrossChat, a modern Cross-Platform Inbox SaaS. The architecture leverages:

- **Supabase** for real-time database, auth, and storage
- **NestJS** for robust backend API
- **Next.js + shadcn/ui** for beautiful, responsive frontend
- **Platform APIs** for seamless integrations
- **Modern best practices** for security, performance, and scalability

The system is designed to scale from small businesses to enterprise customers while maintaining simplicity and ease of use.

---

**Next Steps:**
1. Set up Supabase project
2. Initialize database schema
3. Configure NestJS backend
4. Build core inbox UI
5. Implement first integrations
6. Deploy and test

**Estimated Timeline:** 12-16 weeks for full MVP to production
**Team Size:** 2-3 full-stack developers
