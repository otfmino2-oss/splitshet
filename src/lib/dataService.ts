import { Lead, Expense, Template, LeadStatus, Priority, ExpenseType, Activity, ActivityType, Task, TaskStatus, SourceAnalytics, ForecastData } from '@/types';

const STORAGE_KEYS = {
  USERS: 'vault_users',
  AUTH: 'vault_auth',
};

const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!auth) return null;
    const session = JSON.parse(auth);
    return session?.user?.id || null;
  } catch {
    return null;
  }
};

const getUserStorageKey = (key: string): string => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  return `vault_${userId}_${key}`;
};

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};

const defaultTemplates: Template[] = [
  { id: 'tpl_1', category: 'Welcome', content: 'Hi {{clientName}}, thanks for reaching out! How can I help you today?', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tpl_2', category: 'Follow Up', content: 'Hey {{clientName}}, just checking in on our conversation. Do you have any questions?', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tpl_3', category: 'Proposal', content: 'Hi {{clientName}}, I\'ve attached our proposal for your review. Let me know if you have any questions!', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initializeUserData = () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const keys = ['leads', 'expenses', 'templates', 'activities', 'tasks'];
  const defaults: Record<string, unknown[]> = {
    leads: [],
    expenses: [],
    templates: defaultTemplates,
    activities: [],
    tasks: [],
  };

  keys.forEach(key => {
    if (!localStorage.getItem(getUserStorageKey(key))) {
      localStorage.setItem(getUserStorageKey(key), JSON.stringify(defaults[key] || []));
    }
  });
};

// ========================
// LEADS OPERATIONS
// ========================

export const getAllLeads = (): Lead[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('leads'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getLeadById = (id: string): Lead | undefined => {
  return getAllLeads().find((lead) => lead.id === id);
};

export const createLead = (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead => {
  const leads = getAllLeads();
  const newLead: Lead = {
    ...lead,
    id: `lead_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  leads.push(newLead);
  safeStorage.setItem(getUserStorageKey('leads'), JSON.stringify(leads));
  addActivity(newLead.id, ActivityType.NOTE, 'Lead created');
  return newLead;
};

export const updateLead = (id: string, updates: Partial<Lead>): Lead | null => {
  const leads = getAllLeads();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return null;

  const oldStatus = leads[index].status;
  const updatedLead = { ...leads[index], ...updates, id: leads[index].id, createdAt: leads[index].createdAt, updatedAt: new Date().toISOString() };
  leads[index] = updatedLead;
  safeStorage.setItem(getUserStorageKey('leads'), JSON.stringify(leads));

  if (updates.status && updates.status !== oldStatus) {
    addActivity(id, ActivityType.STATUS_CHANGE, `Status changed from ${oldStatus} to ${updates.status}`);
  }

  return updatedLead;
};

export const deleteLead = (id: string): boolean => {
  const leads = getAllLeads();
  const filtered = leads.filter((lead) => lead.id !== id);
  if (filtered.length === leads.length) return false;
  safeStorage.setItem(getUserStorageKey('leads'), JSON.stringify(filtered));
  return true;
};

export const getLeadsByStatus = (status: LeadStatus): Lead[] => {
  return getAllLeads().filter((lead) => lead.status === status);
};

export const getLeadsByPriority = (priority: Priority): Lead[] => {
  return getAllLeads().filter((lead) => lead.priority === priority);
};

export const getTodayFollowUps = (): Lead[] => {
  const today = new Date().toISOString().split('T')[0];
  return getAllLeads().filter((lead) => lead.followUpDate === today);
};

export const getUpcomingFollowUps = (days: number = 7): Lead[] => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];
  return getAllLeads().filter((lead) => lead.followUpDate >= todayStr && lead.followUpDate <= futureDateStr);
};

// ========================
// ACTIVITIES OPERATIONS
// ========================

export const getAllActivities = (): Activity[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('activities'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getActivitiesByLeadId = (leadId: string): Activity[] => {
  return getAllActivities().filter(a => a.leadId === leadId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addActivity = (leadId: string, type: ActivityType, description: string): Activity => {
  const activities = getAllActivities();
  const newActivity: Activity = {
    id: `act_${Date.now()}`,
    leadId,
    type,
    description,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  activities.push(newActivity);
  safeStorage.setItem(getUserStorageKey('activities'), JSON.stringify(activities));
  return newActivity;
};

export const deleteActivity = (id: string): boolean => {
  const activities = getAllActivities();
  const filtered = activities.filter(a => a.id !== id);
  if (filtered.length === activities.length) return false;
  safeStorage.setItem(getUserStorageKey('activities'), JSON.stringify(filtered));
  return true;
};

// ========================
// TASKS OPERATIONS
// ========================

export const getAllTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('tasks'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getTasksByLeadId = (leadId: string): Task[] => {
  return getAllTasks().filter(t => t.leadId === leadId);
};

export const getTasksByStatus = (status: TaskStatus): Task[] => {
  return getAllTasks().filter(t => t.status === status);
};

export const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
  const tasks = getAllTasks();
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  safeStorage.setItem(getUserStorageKey('tasks'), JSON.stringify(tasks));
  return newTask;
};

export const updateTask = (id: string, updates: Partial<Task>): Task | null => {
  const tasks = getAllTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  const updatedTask = { ...tasks[index], ...updates, id: tasks[index].id, createdAt: tasks[index].createdAt, updatedAt: new Date().toISOString() };
  tasks[index] = updatedTask;
  safeStorage.setItem(getUserStorageKey('tasks'), JSON.stringify(tasks));
  return updatedTask;
};

export const deleteTask = (id: string): boolean => {
  const tasks = getAllTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  safeStorage.setItem(getUserStorageKey('tasks'), JSON.stringify(filtered));
  return true;
};

// ========================
// EXPENSES OPERATIONS
// ========================

export const getAllExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('expenses'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const createExpense = (expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
  const expenses = getAllExpenses();
  const newExpense: Expense = { ...expense, id: `exp_${Date.now()}`, createdAt: new Date().toISOString() };
  expenses.push(newExpense);
  safeStorage.setItem(getUserStorageKey('expenses'), JSON.stringify(expenses));
  return newExpense;
};

export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  return getAllExpenses().filter(e => e.date >= startDate && e.date <= endDate);
};

export const getExpensesByType = (type: ExpenseType): Expense[] => {
  return getAllExpenses().filter(e => e.type === type);
};

export const deleteExpense = (id: string): boolean => {
  const expenses = getAllExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  if (filtered.length === expenses.length) return false;
  safeStorage.setItem(getUserStorageKey('expenses'), JSON.stringify(filtered));
  return true;
};

// ========================
// TEMPLATES OPERATIONS
// ========================

export const getAllTemplates = (): Template[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('templates'));
    return data ? JSON.parse(data) : defaultTemplates;
  } catch {
    return defaultTemplates;
  }
};

export const getTemplateById = (id: string): Template | undefined => {
  return getAllTemplates().find(t => t.id === id);
};

export const createTemplate = (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template => {
  const templates = getAllTemplates();
  const newTemplate: Template = { ...template, id: `tpl_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  templates.push(newTemplate);
  safeStorage.setItem(getUserStorageKey('templates'), JSON.stringify(templates));
  return newTemplate;
};

export const deleteTemplate = (id: string): boolean => {
  const templates = getAllTemplates();
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === templates.length) return false;
  safeStorage.setItem(getUserStorageKey('templates'), JSON.stringify(filtered));
  return true;
};

// ========================
// ANALYTICS
// ========================

export const getSourceAnalytics = (): SourceAnalytics[] => {
  const leads = getAllLeads();
  const sourceMap = new Map<string, { count: number; revenue: number }>();

  leads.forEach(lead => {
    const source = lead.source || 'Unknown';
    const existing = sourceMap.get(source) || { count: 0, revenue: 0 };
    sourceMap.set(source, { count: existing.count + 1, revenue: existing.revenue + (lead.revenue || 0) });
  });

  const totalLeads = leads.length || 1;
  return Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    count: data.count,
    revenue: data.revenue,
    percentage: Math.round((data.count / totalLeads) * 100),
  })).sort((a, b) => b.count - a.count);
};

export const getRevenueForecast = (): ForecastData[] => {
  const leads = getAllLeads();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = new Map<string, number>();
  months.forEach(m => monthlyRevenue.set(`${currentYear}_${m}`, 0));

  leads.filter(l => l.status === LeadStatus.CLOSED_WON && l.revenue > 0).forEach(lead => {
    const leadMonth = new Date(lead.updatedAt).getMonth();
    const leadYear = new Date(lead.updatedAt).getFullYear();
    if (leadYear === currentYear) {
      const key = `${leadYear}_${months[leadMonth]}`;
      monthlyRevenue.set(key, (monthlyRevenue.get(key) || 0) + lead.revenue);
    }
  });

  const avgMonthly = Array.from(monthlyRevenue.values()).filter(v => v > 0).reduce((a, b) => a + b, 0) / Math.max(1, Array.from(monthlyRevenue.values()).filter(v => v > 0).length);

  return months.map((month, i) => ({
    month: `${month} ${currentYear}`,
    actual: i <= currentMonth ? (monthlyRevenue.get(`${currentYear}_${month}`) || 0) : 0,
    predicted: i > currentMonth ? Math.round(avgMonthly) : 0,
  }));
};

// ========================
// FINANCIAL CALCULATIONS
// ========================

export const calculateTotalRevenue = (): number => getAllLeads().reduce((sum, lead) => sum + (lead.revenue || 0), 0);
export const calculateTotalExpenses = (): number => getAllExpenses().reduce((sum, expense) => sum + expense.amount, 0);
export const calculateProfit = (): number => calculateTotalRevenue() - calculateTotalExpenses();
export const calculateAdsExpenses = (): number => getAllExpenses().filter(e => e.type === ExpenseType.META_ADS).reduce((sum, e) => sum + e.amount, 0);
export const calculateROI = (): number => {
  const adsExpenses = calculateAdsExpenses();
  if (adsExpenses === 0) return 0;
  return ((calculateTotalRevenue() - adsExpenses) / adsExpenses) * 100;
};

export const getFinancialSummary = () => ({
  totalRevenue: calculateTotalRevenue(),
  totalExpenses: calculateTotalExpenses(),
  profit: calculateProfit(),
  roiFromAds: calculateROI(),
});

// ========================
// DATA CLEARING
// ========================

export const clearAllUserData = () => {
  const userId = getCurrentUserId();
  if (!userId) return;
  ['leads', 'expenses', 'templates', 'activities', 'tasks'].forEach(key => {
    localStorage.removeItem(`vault_${userId}_${key}`);
  });
};

export const clearAllAppData = () => localStorage.clear();
