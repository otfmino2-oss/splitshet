export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  plan: SubscriptionPlan | string;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled';
  subscriptionEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  emailVerified: string | null;
  verificationToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: string | null;
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
  FREE = 'free',
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
    id: SubscriptionPlan.FREE,
    name: 'Free',
    price: 0,
    period: 'month',
    features: [
      'Up to 50 clients/leads',
      'Basic pipeline management',
      'Revenue & commission tracking',
      'Follow-up reminders',
      '5 message templates',
      'Basic analytics',
      'Community support',
    ],
    maxLeads: 50,
    maxTemplates: 5,
    hasAI: false,
    badge: undefined,
  },
  {
    id: SubscriptionPlan.STARTER,
    name: 'Agency Starter',
    price: 9,
    period: 'month',
    features: [
      'Unlimited clients & leads',
      'Full pipeline management',
      'Revenue & commission tracking',
      'Team collaboration tools',
      'Unlimited message templates',
      'Advanced expense tracking',
      'Project timeline management',
      'Full analytics dashboard',
      'Email support',
    ],
    maxLeads: -1,
    maxTemplates: -1,
    hasAI: false,
    badge: undefined,
  },
  {
    id: SubscriptionPlan.AI_PRO,
    name: 'Agency Pro',
    price: 29,
    period: 'month',
    features: [
      'Everything in Agency Starter',
      'AI Message Composer',
      'AI Lead Insights & Predictions',
      'AI Chat Assistant for client queries',
      'Smart Follow-up Suggestions',
      'Automated Proposal Drafting',
      'Client onboarding automation',
      'Team performance analytics',
      'Priority email support',
      'API access for integrations',
    ],
    maxLeads: -1,
    maxTemplates: -1,
    hasAI: true,
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: SubscriptionPlan.LIFETIME,
    name: 'Agency Lifetime',
    price: 499,
    period: 'one-time',
    features: [
      'Everything in Agency Pro forever',
      'Lifetime access for your agency',
      'One-time payment only',
      'All future updates included',
      'White-label options',
      'Premium priority support',
      'Advanced integrations',
      'Custom reporting',
      'Data export & backup',
      'API access',
      'Lifetime AI features',
    ],
    maxLeads: -1,
    maxTemplates: -1,
    hasAI: true,
    badge: 'Best Value',
  },
];

export const PLAN_FEATURES = {
  aiAssistant: {
    name: 'AI Assistant',
    description: 'Chat with AI to organize, prioritize, and get insights',
    plans: {
      [SubscriptionPlan.FREE]: false,
      [SubscriptionPlan.STARTER]: false,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  aiMessageComposer: {
    name: 'AI Message Composer',
    description: 'Generate personalized follow-ups and proposals',
    plans: {
      [SubscriptionPlan.FREE]: false,
      [SubscriptionPlan.STARTER]: false,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  aiInsights: {
    name: 'AI Lead Insights',
    description: 'Get AI-powered analysis of your leads',
    plans: {
      [SubscriptionPlan.FREE]: false,
      [SubscriptionPlan.STARTER]: false,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  pipeline: {
    name: 'Pipeline & Kanban',
    description: 'Visual deal management with drag & drop',
    plans: {
      [SubscriptionPlan.FREE]: true,
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  timeline: {
    name: 'Client Timeline',
    description: 'Track all interactions with clients',
    plans: {
      [SubscriptionPlan.FREE]: true,
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  tasks: {
    name: 'Task Management',
    description: 'Organize and track your tasks',
    plans: {
      [SubscriptionPlan.FREE]: true,
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  analytics: {
    name: 'Analytics & Reports',
    description: 'Track revenue, conversion, and trends',
    plans: {
      [SubscriptionPlan.FREE]: true,
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  leadManagement: {
    name: 'Lead Management',
    description: 'Capture, organize, and nurture leads',
    plans: {
      [SubscriptionPlan.FREE]: true,
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  expenses: {
    name: 'Expense Tracking',
    description: 'Track business expenses and ROI',
    plans: {
      [SubscriptionPlan.FREE]: true,
      [SubscriptionPlan.STARTER]: true,
      [SubscriptionPlan.AI_PRO]: true,
      [SubscriptionPlan.LIFETIME]: true,
    },
  },
  templates: {
    name: 'Message Templates',
    description: 'Save time with pre-built message templates',
    plans: {
      [SubscriptionPlan.FREE]: true,
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
