# Platform Integration Guide

This guide covers how to integrate various messaging platforms with CrossChat.

## Table of Contents

1. [WhatsApp Business API](#whatsapp-business-api)
2. [Instagram Direct](#instagram-direct)
3. [Facebook Messenger](#facebook-messenger)
4. [Email (Gmail)](#email-gmail)
5. [Email (IMAP/SMTP)](#email-imapsmtp)
6. [Telegram Bot](#telegram-bot)
7. [Custom Chat Widget](#custom-chat-widget)
8. [Twitter (X)](#twitter-x)

---

## WhatsApp Business API

### Prerequisites
- Meta Business Account
- WhatsApp Business API access (not WhatsApp Business App)
- Verified phone number
- SSL certificate for webhook endpoint

### Step 1: Set Up Meta Business Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app
3. Add WhatsApp product to your app
4. Complete business verification

### Step 2: Get Credentials

1. In your Meta app, go to WhatsApp → Getting Started
2. Get your:
   - **Access Token** (temporary, needs to be permanent)
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
   - **Verify Token** (create your own)

### Step 3: Generate Permanent Token

```bash
# Exchange temporary token for permanent one
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id=YOUR_APP_ID&
  client_secret=YOUR_APP_SECRET&
  fb_exchange_token=YOUR_TEMPORARY_TOKEN"
```

### Step 4: Configure Webhook

1. Set webhook URL in Meta console:
   ```
   https://your-domain.com/integrations/whatsapp/webhook
   ```

2. Set verify token (any random string)

3. Subscribe to webhook fields:
   - `messages`
   - `message_status`

### Step 5: Add Integration in CrossChat

```typescript
// POST /integrations/whatsapp/connect
{
  "platform": "whatsapp",
  "credentials": {
    "accessToken": "YOUR_PERMANENT_TOKEN",
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID",
    "businessAccountId": "YOUR_BUSINESS_ACCOUNT_ID",
    "verifyToken": "YOUR_VERIFY_TOKEN"
  },
  "config": {
    "auto_reply": false,
    "greeting_message": "Hello! How can we help you today?"
  }
}
```

### Step 6: Handle Incoming Messages

The backend automatically processes incoming WhatsApp messages:

```typescript
// backend/src/integrations/whatsapp/whatsapp.webhook.ts
@Post('webhook')
async handleWebhook(@Body() payload: any, @Query('hub.verify_token') verifyToken: string) {
  // Webhook verification
  if (payload.hub?.challenge) {
    return { 'hub.challenge': payload.hub.challenge };
  }

  // Process message
  const { entry } = payload;
  for (const item of entry) {
    for (const change of item.changes) {
      if (change.field === 'messages') {
        await this.processIncomingMessage(change.value);
      }
    }
  }
}
```

### Message Format

**Sending:**
```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "text",
  "text": {
    "body": "Hello from CrossChat!"
  }
}
```

**Receiving:**
```json
{
  "messages": [{
    "from": "1234567890",
    "id": "wamid.xxx",
    "timestamp": "1234567890",
    "type": "text",
    "text": {
      "body": "Hi there!"
    }
  }]
}
```

---

## Instagram Direct

### Prerequisites
- Instagram Business Account
- Facebook Page connected to Instagram
- Meta Business Account

### Step 1: Connect Instagram to Facebook Page

1. Go to your Facebook Page settings
2. Click Instagram → Connect Account
3. Log in to your Instagram Business account

### Step 2: Set Up Messaging

1. Go to Page Settings → Messaging
2. Enable "Allow people to contact my Page privately"

### Step 3: Get Page Access Token

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create app or use existing
3. Add Instagram Messaging product
4. Generate Page Access Token with permissions:
   - `pages_messaging`
   - `instagram_basic`
   - `instagram_manage_messages`

### Step 4: Configure Webhook

1. Set webhook URL:
   ```
   https://your-domain.com/integrations/instagram/webhook
   ```

2. Subscribe to fields:
   - `messages`
   - `messaging_postbacks`

### Step 5: Add Integration

```typescript
// POST /integrations/instagram/connect
{
  "platform": "instagram",
  "credentials": {
    "pageAccessToken": "YOUR_PAGE_ACCESS_TOKEN",
    "pageId": "YOUR_PAGE_ID",
    "instagramAccountId": "YOUR_INSTAGRAM_ACCOUNT_ID"
  }
}
```

### Sending Messages

```typescript
// Via Graph API
POST https://graph.facebook.com/v18.0/me/messages
{
  "recipient": {
    "id": "<PSID>"
  },
  "message": {
    "text": "Hello from CrossChat!"
  }
}
```

---

## Facebook Messenger

### Prerequisites
- Facebook Page
- Meta Business Account

### Step 1: Set Up Facebook App

1. Create app at [Meta for Developers](https://developers.facebook.com/)
2. Add Messenger product
3. Generate Page Access Token

### Step 2: Configure Webhook

1. Set webhook URL:
   ```
   https://your-domain.com/integrations/facebook/webhook
   ```

2. Subscribe to:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`
   - `message_reads`

### Step 3: Add Integration

```typescript
{
  "platform": "facebook",
  "credentials": {
    "pageAccessToken": "YOUR_PAGE_ACCESS_TOKEN",
    "pageId": "YOUR_PAGE_ID",
    "appId": "YOUR_APP_ID",
    "appSecret": "YOUR_APP_SECRET"
  }
}
```

---

## Email (Gmail)

### Prerequisites
- Gmail account
- Google Cloud Project

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Gmail API

### Step 2: Create OAuth Credentials

1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://your-domain.com/integrations/gmail/callback
   ```

### Step 3: Get OAuth Tokens

1. Direct user to OAuth consent screen:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     scope=https://www.googleapis.com/auth/gmail.modify&
     response_type=code&
     access_type=offline
   ```

2. Exchange code for tokens:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d code=AUTH_CODE \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET \
     -d redirect_uri=YOUR_REDIRECT_URI \
     -d grant_type=authorization_code
   ```

### Step 4: Add Integration

```typescript
{
  "platform": "gmail",
  "credentials": {
    "accessToken": "YOUR_ACCESS_TOKEN",
    "refreshToken": "YOUR_REFRESH_TOKEN",
    "email": "user@gmail.com"
  }
}
```

### Step 5: Watch for New Emails

```typescript
// Set up Gmail push notifications
POST https://gmail.googleapis.com/gmail/v1/users/me/watch
{
  "topicName": "projects/YOUR_PROJECT/topics/gmail-notifications",
  "labelIds": ["INBOX"]
}
```

---

## Email (IMAP/SMTP)

### Prerequisites
- Email account with IMAP/SMTP access
- App-specific password (for Gmail, Outlook)

### Step 1: Get IMAP/SMTP Settings

**Gmail:**
- IMAP: `imap.gmail.com:993` (SSL)
- SMTP: `smtp.gmail.com:587` (TLS)

**Outlook:**
- IMAP: `outlook.office365.com:993` (SSL)
- SMTP: `smtp.office365.com:587` (TLS)

### Step 2: Create App Password

**Gmail:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password

**Outlook:**
1. Go to Account Security
2. Generate App Password

### Step 3: Add Integration

```typescript
{
  "platform": "imap",
  "credentials": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "email": "your@email.com",
    "password": "app-password",
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false
    }
  }
}
```

---

## Telegram Bot

### Prerequisites
- Telegram account

### Step 1: Create Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow instructions to create bot
4. Save the **Bot Token**

### Step 2: Set Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/integrations/telegram/webhook"
```

### Step 3: Add Integration

```typescript
{
  "platform": "telegram",
  "credentials": {
    "botToken": "YOUR_BOT_TOKEN",
    "botUsername": "your_bot_username"
  }
}
```

### Sending Messages

```typescript
// Via Telegram Bot API
POST https://api.telegram.org/bot<TOKEN>/sendMessage
{
  "chat_id": "123456789",
  "text": "Hello from CrossChat!"
}
```

---

## Custom Chat Widget

### Step 1: Generate Widget Code

```javascript
<script src="https://cdn.crosschat.com/widget.js"></script>
<script>
  CrossChat.init({
    businessId: 'YOUR_BUSINESS_ID',
    apiKey: 'YOUR_API_KEY',
    theme: 'light', // or 'dark'
    position: 'bottom-right', // bottom-right, bottom-left
    primaryColor: '#0066cc',
    greeting: 'Hi! How can we help you?'
  });
</script>
```

### Step 2: Customize Appearance

```javascript
CrossChat.init({
  businessId: 'YOUR_BUSINESS_ID',
  apiKey: 'YOUR_API_KEY',
  styles: {
    buttonColor: '#0066cc',
    headerColor: '#0066cc',
    headerTextColor: '#ffffff',
    messageColor: '#f0f0f0',
    agentMessageColor: '#0066cc',
    fontFamily: 'Arial, sans-serif'
  }
});
```

### Step 3: Handle Events

```javascript
CrossChat.on('ready', () => {
  console.log('Widget loaded');
});

CrossChat.on('message', (message) => {
  console.log('New message:', message);
});

CrossChat.on('close', () => {
  console.log('Widget closed');
});
```

---

## Twitter (X)

### Prerequisites
- Twitter Developer Account
- Elevated access for Direct Messages

### Step 1: Create Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create new app
3. Enable OAuth 1.0a
4. Get API credentials:
   - API Key
   - API Secret
   - Access Token
   - Access Token Secret

### Step 2: Request Elevated Access

1. In Developer Portal, request Elevated access
2. Fill out use case questionnaire
3. Wait for approval

### Step 3: Set Up Webhook

1. Register webhook URL:
   ```bash
   curl -X POST "https://api.twitter.com/1.1/account_activity/all/:env_name/webhooks.json" \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
     -d "url=https://your-domain.com/integrations/twitter/webhook"
   ```

2. Subscribe to account:
   ```bash
   curl -X POST "https://api.twitter.com/1.1/account_activity/all/:env_name/subscriptions.json" \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN"
   ```

### Step 4: Add Integration

```typescript
{
  "platform": "twitter",
  "credentials": {
    "apiKey": "YOUR_API_KEY",
    "apiSecret": "YOUR_API_SECRET",
    "accessToken": "YOUR_ACCESS_TOKEN",
    "accessTokenSecret": "YOUR_ACCESS_TOKEN_SECRET",
    "bearerToken": "YOUR_BEARER_TOKEN"
  }
}
```

---

## Testing Integrations

### Test Webhook Endpoints

```bash
# Test WhatsApp webhook
curl -X POST http://localhost:3001/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "text": { "body": "Test message" }
          }]
        }
      }]
    }]
  }'
```

### Test Message Sending

```bash
# Test sending message via API
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "conversation_id": "uuid",
    "content": "Hello!",
    "platform": "whatsapp"
  }'
```

---

## Troubleshooting

### Common Issues

**Webhook not receiving messages:**
- Check SSL certificate is valid
- Verify webhook URL is publicly accessible
- Check firewall settings
- Verify subscription is active

**Authentication errors:**
- Regenerate tokens
- Check token expiration
- Verify permissions/scopes
- Check API rate limits

**Messages not sending:**
- Check platform API status
- Verify credentials are correct
- Check message format
- Review platform-specific requirements

### Debug Mode

Enable debug logging:

```typescript
// backend/.env
LOG_LEVEL=debug
```

```typescript
// dashboard/.env.local
NEXT_PUBLIC_DEBUG=true
```

---

## Best Practices

1. **Secure Credentials**
   - Never commit credentials to git
   - Use environment variables
   - Encrypt sensitive data in database

2. **Handle Rate Limits**
   - Implement exponential backoff
   - Queue messages
   - Cache API responses

3. **Monitor Webhooks**
   - Log all webhook events
   - Set up alerts for failures
   - Implement retry logic

4. **Test Thoroughly**
   - Test all message types
   - Test error scenarios
   - Test at scale

---

## Support

For integration help:
- Email: integrations@crosschat.com
- Discord: [Join our community](https://discord.gg/crosschat)
- Documentation: https://docs.crosschat.com

---

**Last Updated:** November 2025
