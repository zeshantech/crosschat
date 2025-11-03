# CrossChat - Cross-Platform Inbox SaaS

A comprehensive unified inbox SaaS platform that consolidates customer communications from multiple channels (WhatsApp, Instagram, Facebook, Email, Telegram, and more) into a single, intuitive dashboard.

![CrossChat](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Features

### Core Features
- ✅ **Unified Inbox** - Single view for all customer conversations across platforms
- ✅ **Real-time Messaging** - Instant message synchronization powered by Supabase Realtime
- ✅ **Multi-Channel Support** - WhatsApp, Instagram, Facebook, Email, Telegram, Custom Widget
- ✅ **Smart Assignment** - AI-powered routing, round-robin, and manual assignment
- ✅ **Team Collaboration** - Role-based access control (Owner, Admin, Manager, Agent)
- ✅ **Customer Management** - Unified profiles with interaction history and CRM features
- ✅ **AI Chatbot** - Automated responses with intelligent escalation
- ✅ **Real-time Notifications** - Desktop notifications and sound alerts
- ✅ **Typing Indicators** - See when customers or agents are typing
- ✅ **Online Presence** - Real-time team member availability status
- ✅ **Multi-tenant** - Secure business isolation with Row Level Security

### Platform Integrations
- 📱 **WhatsApp Business API** - Via Meta Business
- 📷 **Instagram Direct** - Meta Business API
- 👍 **Facebook Messenger** - Meta Graph API
- 📧 **Email** - Gmail, Outlook, IMAP/SMTP
- ✈️ **Telegram** - Bot API
- 🐦 **Twitter (X)** - Coming soon
- 🌐 **Custom Chat Widget** - Embeddable JavaScript widget
- 📞 **Voice Calls** - VoIP integration (coming soon)

### Advanced Features
- 🤖 **AI-Powered Responses** - OpenAI/Anthropic integration
- 📊 **Analytics Dashboard** - Team performance and conversation metrics
- 🎯 **Smart Routing** - Skill-based and sentiment-based assignment
- 🏷️ **Tags & Notes** - Organize conversations and customers
- 💳 **Payment Integration** - Stripe and PayFast support
- 🔐 **Enterprise Security** - Row-level security, encrypted credentials
- 🌍 **Multi-language** - Support for multiple languages
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **Framework:** Next.js 16 (App Router)
- **UI Library:** shadcn/ui (Radix UI + Tailwind CSS)
- **Real-time:** Supabase Realtime
- **State Management:** React Hooks
- **Forms:** React Hook Form + Yup

**Backend:**
- **Framework:** NestJS 11
- **Database:** PostgreSQL (via Supabase)
- **Real-time:** Supabase Realtime (PostgreSQL LISTEN/NOTIFY)
- **Authentication:** Supabase Auth + JWT
- **Storage:** Supabase Storage

**Infrastructure:**
- **Database:** Supabase (PostgreSQL 15+)
- **File Storage:** Supabase Storage
- **Authentication:** Supabase Auth
- **Payments:** Stripe + PayFast
- **Messaging APIs:** Meta, Twilio, Telegram

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 15+ (via Supabase)
- Supabase Account
- Platform API credentials (optional for integrations)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crosschat
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migration:
   ```bash
   # Copy the SQL from supabase/migrations/001_initial_schema.sql
   # and run it in your Supabase SQL Editor
   ```
3. Get your Supabase credentials:
   - URL: `https://your-project.supabase.co`
   - Anon Key: From Settings → API
   - Service Role Key: From Settings → API (keep secret!)

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local and add your credentials
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
crosschat/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── businesses/        # Business management
│   │   ├── team/              # Team member management
│   │   ├── customers/         # Customer profiles
│   │   ├── conversations/     # Conversation management
│   │   ├── messages/          # Message handling
│   │   ├── common/
│   │   │   ├── supabase/      # Supabase service wrapper
│   │   │   ├── decorators/    # Custom decorators
│   │   │   └── guards/        # Auth guards
│   │   └── main.ts
│   └── package.json
│
├── dashboard/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js app router
│   │   ├── components/
│   │   │   ├── inbox/         # Inbox components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── dashboard/     # Layout components
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useRealtimeMessages.ts
│   │   │   ├── useRealtimeConversations.ts
│   │   │   ├── useTypingIndicator.ts
│   │   │   └── usePresence.ts
│   │   └── lib/
│   │       └── supabase/      # Supabase client
│   └── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── TECHNICAL_SPECIFICATION.md  # Complete technical docs
├── README.md
└── package.json
```

## 🗄️ Database Schema

The database schema includes:

- **businesses** - Multi-tenant business accounts
- **users** - User profiles (linked to Supabase Auth)
- **team_members** - Links users to businesses with roles
- **customers** - Unified customer profiles
- **conversations** - Conversation threads
- **messages** - Individual messages
- **platform_integrations** - Platform credentials
- **ai_chatbots** - AI chatbot configurations
- **notifications** - User notifications
- **subscription_plans** - Plan definitions
- **webhooks** - Outgoing webhooks

See `TECHNICAL_SPECIFICATION.md` for complete schema details.

## 🔐 Authentication & Security

### Row Level Security (RLS)
All tables have RLS policies ensuring users can only access data from their businesses:

```sql
-- Example: Users can only view conversations in their businesses
CREATE POLICY "Users can view conversations in their businesses" ON conversations
  FOR SELECT
  USING (business_id IN (SELECT get_user_businesses(auth.uid())));
```

### Role-Based Access Control (RBAC)

Five role levels with granular permissions:
- **Owner** - Full access including billing
- **Admin** - Full access except billing
- **Manager** - Team and conversation management
- **Agent** - Conversation handling
- **Limited Agent** - Only assigned conversations

## 🔌 Platform Integrations

### WhatsApp Business API

```typescript
// Set up WhatsApp integration
const integration = {
  platform: 'whatsapp',
  credentials: {
    accessToken: 'YOUR_META_ACCESS_TOKEN',
    phoneNumberId: 'YOUR_PHONE_NUMBER_ID'
  }
};
```

### Instagram Direct

```typescript
// Set up Instagram integration
const integration = {
  platform: 'instagram',
  credentials: {
    pageAccessToken: 'YOUR_PAGE_ACCESS_TOKEN',
    pageId: 'YOUR_PAGE_ID'
  }
};
```

### Email (IMAP)

```typescript
// Set up IMAP integration
const integration = {
  platform: 'imap',
  credentials: {
    host: 'imap.gmail.com',
    port: 993,
    email: 'your@email.com',
    password: 'app-password'
  }
};
```

See `TECHNICAL_SPECIFICATION.md` for complete integration guides.

## 🌊 Real-time Features

### Supabase Realtime Setup

```typescript
// Subscribe to new messages
const channel = supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

### Frontend Hooks

```typescript
// Use real-time messages
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

const { messages, loading } = useRealtimeMessages(conversationId);

// Use typing indicators
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

const { typingUsers, startTyping, stopTyping } = useTypingIndicator(conversationId, userId);

// Use presence
import { usePresence } from '@/hooks/usePresence';

const { onlineMembers } = usePresence(businessId, userId);
```

## 💳 Payment Integration

### Stripe

```bash
# Set environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayFast (South Africa)

```bash
# Set environment variables
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
```

## 📊 API Documentation

### REST API Endpoints

**Authentication:**
```
POST   /auth/signup
POST   /auth/login
GET    /auth/me
```

**Conversations:**
```
GET    /conversations              # List conversations
GET    /conversations/:id          # Get conversation
POST   /conversations              # Create conversation
PATCH  /conversations/:id          # Update conversation
POST   /conversations/:id/assign   # Assign conversation
POST   /conversations/:id/read     # Mark as read
```

**Messages:**
```
GET    /messages?conversationId=   # List messages
POST   /messages                   # Send message
POST   /messages/:id/read          # Mark as read
```

**Customers:**
```
GET    /customers                  # List customers
GET    /customers/:id              # Get customer
POST   /customers                  # Create customer
PATCH  /customers/:id              # Update customer
POST   /customers/:id/notes        # Add note
POST   /customers/:id/tags         # Add tags
```

**Team:**
```
GET    /team                       # List team members
POST   /team/invite                # Invite member
PATCH  /team/:id/role              # Update role
```

See `TECHNICAL_SPECIFICATION.md` for complete API documentation.

## 🚀 Deployment

### Backend (Railway/Render)

```bash
# Build
npm run build

# Start production
npm run start:prod
```

### Frontend (Vercel)

```bash
# Deploy to Vercel
vercel deploy --prod
```

### Environment Variables

Set all production environment variables from `.env.example` files.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd dashboard
npm run test
```

## 📈 Development Roadmap

### Phase 1: MVP (Current) ✅
- [x] Core database schema
- [x] Authentication system
- [x] Real-time messaging
- [x] Basic inbox UI
- [x] Team management
- [x] Customer management

### Phase 2: Integrations 🚧
- [ ] WhatsApp Business API
- [ ] Instagram Direct
- [ ] Facebook Messenger
- [ ] Email (Gmail/IMAP)
- [ ] Telegram Bot
- [ ] Custom widget

### Phase 3: Advanced Features 📋
- [ ] AI chatbot integration
- [ ] Voice calls (VoIP)
- [ ] Advanced analytics
- [ ] Automation workflows
- [ ] Mobile app
- [ ] API access for developers

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📞 Support

For support, email support@crosschat.com or join our community Discord.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Next.js](https://nextjs.org) - Frontend framework
- [NestJS](https://nestjs.com) - Backend framework
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

**Built with ❤️ for businesses that need a simple yet powerful unified inbox**
