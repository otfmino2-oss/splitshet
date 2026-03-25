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
  name: string;
  contact: string;
  source: string;
  status: LeadStatus;
  priority: Priority;
  followUpDate: string;
  lastMessage: string;
  notes: string;
  templatesUsed: string[];
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface Template {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  description: string;
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  leadId?: string;
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
