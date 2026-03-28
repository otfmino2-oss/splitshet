export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  INTERESTED = 'Interested',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost',
}

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum ExpenseType {
  META_ADS = 'Meta Ads',
  TOOLS = 'Tools',
  OTHER = 'Other',
}

export enum ActivityType {
  NOTE = 'Note',
  CALL = 'Call',
  EMAIL = 'Email',
  MEETING = 'Meeting',
  PROPOSAL = 'Proposal',
  PAYMENT = 'Payment',
  STATUS_CHANGE = 'Status Change',
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export interface Lead {
  id: string;
  userId: string;
  name: string;
  contact: string;
  source: string;
  status: LeadStatus | string;
  priority: Priority | string;
  followUpDate: string | null;
  lastMessage: string | null;
  notes: string | null;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  type: ExpenseType | string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
}

export interface Template {
  id: string;
  userId: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  leadId: string | null;
  type: ActivityType | string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus | string;
  priority: Priority | string;
  dueDate: string;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  roiFromAds?: number;
}

export interface SourceAnalytics {
  source: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface ForecastData {
  month: string;
  predicted: number;
  actual: number;
}
