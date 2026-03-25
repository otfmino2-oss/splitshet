export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: SubscriptionPlan;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionEndDate?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface StoredUser extends Omit<User, 'passwordHash'> {
  passwordHash?: string;
}

export interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export enum SubscriptionPlan {
  STARTER = 'starter',
  AI_PRO = 'ai_pro',
  LIFETIME = 'lifetime',
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  period: 'month' | 'one-time';
  features: string[];
  maxLeads: number;
  maxTemplates: number;
  hasAI: boolean;
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: PlanDetails[] = [
  {
    id: SubscriptionPlan.STARTER,
    name: 'Starter',
    price: 12,
    period: 'month',
    features: [
      'Unlimited leads',
      'Pipeline management',
      'Revenue tracking',
      'Follow-up reminders',
      'Message templates',
      'Expense tracking',
      'Analytics',
      'Email support',
    ],
    maxLeads: -1,
    maxTemplates: -1,
    hasAI: false,
    badge: undefined,
  },
  {
    id: SubscriptionPlan.AI_PRO,
    name: 'AI Pro',
    price: 35,
    period: 'month',
    features: [
      'Everything in Starter',
      'AI Message Composer',
      'AI Lead Insights',
      'AI Chat Assistant',
      'Smart Follow-up Suggestions',
      'Automated Proposal Drafting',
      'Priority support',
      'Early access to AI features',
    ],
    maxLeads: -1,
    maxTemplates: -1,
    hasAI: true,
    highlighted: true,
    badge: 'Popular',
  },
  {
    id: SubscriptionPlan.LIFETIME,
    name: 'Lifetime',
    price: 120,
    period: 'one-time',
    features: [
      'Everything in Starter',
      'Lifetime updates',
      'No recurring fees',
      'Early access to new features',
      'Priority support',
      'Data export',
      'API access',
      '❌ AI features NOT included',
    ],
    maxLeads: -1,
    maxTemplates: -1,
    hasAI: false,
    badge: 'Best Value',
  },
];

export const PLAN_FEATURES = {
  aiAssistant: {
    name: 'AI Assistant',
    description: 'Chat with AI to organize, prioritize, and get insights',
    plans: {
      [SubscriptionPlan.STARTER]: false,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: false,
    },
  },
  aiMessageComposer: {
    name: 'AI Message Composer',
    description: 'Generate personalized follow-ups and proposals',
    plans: {
      [SubscriptionPlan.STARTER]: false,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: false,
    },
  },
  aiInsights: {
    name: 'AI Lead Insights',
    description: 'Get AI-powered analysis of your leads',
    plans: {
      [SubscriptionPlan.STARTER]: false,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: false,
    },
  },
  pipeline: {
    name: 'Pipeline & Kanban',
    description: 'Visual deal management with drag & drop',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  timeline: {
    name: 'Client Timeline',
    description: 'Track all interactions with clients',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  tasks: {
    name: 'Task Management',
    description: 'Organize and track your tasks',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  analytics: {
    name: 'Analytics & Reports',
    description: 'Track revenue, conversion, and trends',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  leadManagement: {
    name: 'Lead Management',
    description: 'Capture, organize, and nurture leads',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  expenses: {
    name: 'Expense Tracking',
    description: 'Track business expenses and ROI',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  templates: {
    name: 'Message Templates',
    description: 'Save time with pre-built message templates',
    plans: {
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
};

export function hasFeature(plan: SubscriptionPlan, feature: keyof typeof PLAN_FEATURES): boolean {
  return PLAN_FEATURES[feature].plans[plan] ?? false;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
