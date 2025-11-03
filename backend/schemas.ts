interface user {
  email: string,
  passwordHash: string,
  phoneNumber: string,
  firstName: string,
  lastName: string,
}

interface store {
  storeType: 'shopify' | 'woocommerce',
  storeName: string,
  storeUrl: string,

  // OAuth/Credentials (encrypted)
  accessToken?: string, // For Shopify
  refreshToken?: string, // For Shopify (if available)
  consumerKey?: string, // For WooCommerce
  consumerSecret?: string, // For WooCommerce (encrypted)

  // Webhook Info
  webhookId?: string,
  webhookSecret?: string, // encrypted
  webhookUrl?: string,
  lastWebhookReceived?: Date,

  // calls
  remainingCalls: number,
  usedCalls: number,

  // metadata
  isConnected: boolean,
  connectedAt: Date,
}

interface role {
  name: string,
  permissions: {
    order: {
      view: boolean,
      manage: boolean,
    },
    settings: {
      view: boolean,
      manage: boolean,
    },
    members: {
      view: boolean,
      manage: boolean,
    },
    analytics: {
      view: boolean,
      manage: boolean,
    },
    billing: {
      view: boolean,
      manage: boolean,
    },
  },

  storeId: string,
}

interface member {
  roleId: string,
  userId: string,
  storeId: string,
}

interface order {
  storeId: string,

  // customer details
  customerEmail: string,
  customerPhone: string,
  customerName?: string,

  // order info
  externalOrderId: string,
  orderAmount: number,
  currency: string,
  itemCount: number,
  orderUrl: string

  // status
  status: 'pending' | 'scheduled' | 'confirmed' | 'cancelled' | 'phone_error' | 'no_answer' | 'retrying',
  confirmationType: 'keypad' | 'voice'

  // call attempts
  callAttempts: number,
  maxRetries: number,
  lastCallAt?: Date,
  nextRetryAt?: Date,
}


interface callLog {
  orderId: string,
  
  // call details
  twilioCallSid: string,
  toPhoneNumber: string,
  fromPhoneNumber: string,
  callStartedAt: Date,
  callEndedAt: Date,
  callDurationSeconds: number,

  callStatus: 'completed' | 'failed' | 'no_answer' | 'busy',

  // confirmation details
  confirmationType: 'keypad' | 'voice'
  confirmationStatus: 'pending' | 'confirmed' | 'failed'

  // error
  errorMessage?: string,

  // billing
  creditsUsed: number,
  usedGpt: boolean,
  gptCreditsUsed?: number,
}


interface storeSettings {
  storeId: string,
  
  // Call Customization
  voiceId: string,
  voiceLanguage: string,
  
  autoQueueOrders: boolean, // auto-queue if in 'processing'
  useOwnGptApiKey: boolean,
  useOwnTwilioAccount: boolean,

  // -- Twilio Account (optional - user provided)
  twilioVerified: boolean
  twillioAuthToken: string, // encrypted
  twillioAccountSid: string,
  twillioPhoneNumber: string,  
  
  // -- OpenAI API Key (optional - user provided)
  openAIApiKey: string, // encrypted
  
  // Retry Settings
  maxRetries: number,
  retryIntervals: number[], // minutes
  
  // default Confirmation Mode
  confirmationMode: 'keypad' | 'voice',

  // Prompts/Messages
  customInitPrompt?: string, // "Hello, this is a call from [Your Company] regarding your recent order amount of $XX.XX."
  confirmationPrompt?: string, // "Can you confirm this order?"
  successMessage?: string, // "Thank you for your order"
  failureMessage?: string, // "We are cancelling your order"

  // Platform Notifications
  enableWhatsappNotification: boolean,
  enableEmailNotification: boolean,
  enablePushNotification: boolean,

  // User Notifications
  whatsappTemplate?: string,
  emailTemplate?: string,

}

interface plan {
  id: string,
  name: string,
  
  price: number,
  currency: string,
  
  // credit_based fields
  calls: number,
}

interface paymentTimeline {
  id: string,
  userId: string,
  storeId: string,
  
  amount: number,
  currency: string,

  paymentProvider: 'stripe' | 'paypal' | 'payfast',
  paymentProviderPaymentId: string,
  status: 'pending' | 'completed' | 'failed',
  
  planId: string,
}