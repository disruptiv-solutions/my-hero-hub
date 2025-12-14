// Calendar Types
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  hangoutLink?: string;
  meetLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      uri?: string;
      entryPointType?: string;
    }>;
  };
  colorId?: string;
  calendarId?: string;
  accountEmail?: string; // Email account this event belongs to (for multi-account support)
}

// Email Types
export interface Email {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  isUnread: boolean;
  isStarred: boolean;
  accountEmail?: string;
}

export interface EmailAccount {
  email: string;
  unreadCount: number;
  isVIP?: boolean;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'lead' | 'active' | 'closed';
  value?: number;
  lastContact?: string;
  createdDate: string;
  notes?: string;
  projectCount?: number;
  newsletterSubscribed?: boolean;
  events?: string[];
  transcripts?: ClientTranscript[];
  // Analytics stats (optional, added when fetching clients list)
  analytics?: {
    sentiment?: 'positive' | 'neutral' | 'negative';
    engagement?: 'high' | 'medium' | 'low';
    nextBestAction?: string;
  };
  transcriptCount?: number;
  actionItemCount?: number;
}

export interface ClientTranscript {
  id: string;
  content: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientChatSession {
  id: string;
  clientId: string;
  userId: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ClientActionItem {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  masterPriorityId?: string; // Link to master priority if synced
}

export interface MasterPriority {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  clientId?: string; // Optional: link to a client
  clientActionItemId?: string; // Optional: link to client action item
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ClientAnalytics {
  id: string;
  clientId: string;
  avatar: {
    description: string;
    characteristics: string[];
    ageRange?: string; // e.g., "25-35", "40-50", "55+"
  };
  sentimentTrend: {
    current: "positive" | "neutral" | "negative";
    change: number; // percentage change
    description: string;
  };
  engagementLevel: {
    level: "high" | "medium" | "low";
    status: string;
    description: string;
  };
  keyTopics: string[];
  nextBestAction: {
    action: string;
    reasoning: string;
  };
  analysisHistory: Array<{
    timestamp: string;
    summary: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  value: number;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Interaction {
  id: string;
  clientId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  date: string;
  notes: string;
}

// Financial Types
export interface Transaction {
  id: string;
  accountId?: string;
  clientId?: string;
  amount: number;
  currency?: string;
  date: string;
  type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'cancelled';
  description: string;
  category?: string;
}

export interface FinancialMetrics {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  pipelineValue: number;
  recentTransactions: Transaction[];
}

export interface BankAccount {
  id: string;
  stripeAccountId: string;
  institutionName?: string | null;
  last4?: string | null;
  category?: string | null;
  status?: string;
  permissions?: string[];
  supportedPaymentMethodTypes?: string[];
  balance?: {
    currency?: string;
    current?: number;
    available?: number;
    asOf?: string;
  };
  linkedAt?: string;
  livemode?: boolean;
}

// Marketing Types
export interface MarketingCampaign {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'completed';
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate?: string;
}

export interface MarketingMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  campaigns: MarketingCampaign[];
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order: number;
}

// Activity Feed Types
export interface ActivityItem {
  id: string;
  type: 'email' | 'calendar' | 'client' | 'payment' | 'task';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  color?: string;
}

// Query Types
export interface AIQuery {
  query: string;
  context?: 'email' | 'calendar' | 'client' | 'financial' | 'all';
}

export interface AIResponse {
  answer: string;
  results?: any[];
  suggestions?: string[];
}

// Live Notes Types
export interface LiveNoteSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastSummary?: string;
  totalShots?: number;
  summary?: string;
}

export interface LiveNoteShot {
  id: string;
  sessionId: string;
  imageDataUrl: string;
  interpretation?: string;
  createdAt: string;
}

// Voice Notes Types
export interface VoiceNoteSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastSummary?: string;
  lastTaskCount?: number;
  totalEntries?: number;
  summary?: string;
  tasks?: Array<{ title: string; priority?: "low" | "medium" | "high" }>;
}

export interface VoiceNoteEntry {
  id: string;
  sessionId: string;
  text: string;
  createdAt: string;
}
