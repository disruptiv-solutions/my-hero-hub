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
  clientId?: string;
  amount: number;
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


