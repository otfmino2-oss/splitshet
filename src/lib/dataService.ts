import { Lead, Expense, Template, LeadStatus, Priority, ExpenseType, Activity, ActivityType, Task, TaskStatus, SourceAnalytics, ForecastData } from '@/types';
import { getValidAccessToken, resetRefreshPromise } from '@/lib/tokenManager';

// ========================
// API BASE URL
// ========================

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

// ========================
// AUTHENTICATION HELPERS
// ========================

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('accessToken');
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('refreshToken');
    return token;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      resetRefreshPromise();
      return null;
    }

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Clear tokens on failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      resetRefreshPromise();
      return null;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens on error
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    resetRefreshPromise();
    return null;
  }
};

const apiRequest = async (endpoint: string, options: RequestInit = {}, retryCount = 0) => {
  try {
    // Get valid token (handles refresh if needed)
    const token = await getValidAccessToken(getAuthToken, getRefreshToken, refreshAccessToken);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      // If unauthorized after having a token, log out
      if (response.status === 401 && retryCount === 0) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        resetRefreshPromise();
        
        // Retry once with potential new token
        return apiRequest(endpoint, options, retryCount + 1);
      }

      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// ========================
// LEGACY LOCAL STORAGE (for backward compatibility)
// ========================

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

const getDefaultTemplates = (): Template[] => {
  const userId = getCurrentUserId() || 'default';
  return [
    { id: 'tpl_1', userId, category: 'Welcome', content: 'Hi {{clientName}}, thanks for reaching out! How can I help you today?', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tpl_2', userId, category: 'Follow Up', content: 'Hey {{clientName}}, just checking in on our conversation. Do you have any questions?', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tpl_3', userId, category: 'Proposal', content: 'Hi {{clientName}}, I\'ve attached our proposal for your review. Let me know if you have any questions!', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
};

const initializeUserData = () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const keys = ['leads', 'expenses', 'templates', 'activities', 'tasks'];
  const defaults: Record<string, unknown[]> = {
    leads: [],
    expenses: [],
    templates: getDefaultTemplates(),
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
// RESPONSE CACHING
// ========================

const responseCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

const getCached = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  duration = CACHE_DURATION
): Promise<T> => {
  const now = Date.now();
  const cached = responseCache.get(key);
  
  if (cached && now - cached.timestamp < duration) {
    return cached.data as T;
  }
  
  const data = await fetcher();
  responseCache.set(key, { data, timestamp: now });
  return data;
};

// ========================
// LEADS OPERATIONS
// ========================

export const getAllLeads = async (useCache = true): Promise<Lead[]> => {
  try {
    return await (useCache
      ? getCached('leads', () => apiRequest('/api/leads'))
      : apiRequest('/api/leads'));
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return getAllLeadsLocal();
  }
};

export const getLeadsFiltered = async (filters: {
  status?: LeadStatus;
  priority?: Priority;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<Lead[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.source) queryParams.append('source', filters.source);
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.offset) queryParams.append('offset', filters.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/leads?${queryString}` : '/api/leads';

    return await apiRequest(endpoint);
  } catch (error) {
    console.error('Failed to fetch filtered leads:', error);
    // Fallback to local filtering
    const allLeads = getAllLeadsLocal();
    return allLeads.filter(lead => {
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.priority && lead.priority !== filters.priority) return false;
      if (filters.source && lead.source !== filters.source) return false;
      return true;
    }).slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || allLeads.length));
  }
};

export const bulkUpdateLeads = async (updates: { id: string; data: Partial<Lead> }[]): Promise<Lead[]> => {
  try {
    const results = await Promise.all(
      updates.map(({ id, data }) =>
        apiRequest(`/api/leads/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      )
    );
    return results;
  } catch (error) {
    console.error('Failed to bulk update leads:', error);
    throw new Error('Failed to update multiple leads. Please try again.');
  }
};

export const getLeadStats = async (): Promise<{
  total: number;
  byStatus: Record<LeadStatus, number>;
  byPriority: Record<Priority, number>;
  totalRevenue: number;
  conversionRate: number;
}> => {
  try {
    const leads = await getAllLeads();
    const stats = {
      total: leads.length,
      byStatus: {} as Record<LeadStatus, number>,
      byPriority: {} as Record<Priority, number>,
      totalRevenue: 0,
      conversionRate: 0,
    };

    // Initialize status counts
    Object.values(LeadStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Initialize priority counts
    Object.values(Priority).forEach(priority => {
      stats.byPriority[priority] = 0;
    });

    leads.forEach(lead => {
      stats.byStatus[lead.status]++;
      stats.byPriority[lead.priority]++;
      stats.totalRevenue += lead.revenue || 0;
    });

    const closedWon = stats.byStatus[LeadStatus.CLOSED_WON] || 0;
    stats.conversionRate = stats.total > 0 ? (closedWon / stats.total) * 100 : 0;

    return stats;
  } catch (error) {
    console.error('Failed to get lead stats:', error);
    throw new Error('Failed to load lead statistics.');
  }
};

export const createLead = async (lead: Omit<Lead, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
  try {
    const payload = {
      ...lead,
      followUpDate: lead.followUpDate ? lead.followUpDate : undefined,
    };
    console.log('Creating lead with data:', payload);

    const newLead = await apiRequest('/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log('Lead created successfully:', newLead);
    return newLead;
  } catch (error) {
    console.error('Failed to create lead:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    throw new Error(error instanceof Error ? error.message : 'Failed to save lead to database. Please check your connection and try again.');
  }
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead | null> => {
  try {
    console.log('Updating lead:', id, 'with data:', updates);
    const updatedLead = await apiRequest(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    console.log('Lead updated successfully:', updatedLead);
    return updatedLead;
  } catch (error) {
    console.error('Failed to update lead:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    // Don't fallback to localStorage - throw error so user knows data wasn't saved
    throw new Error('Failed to update lead in database. Please check your connection and try again.');
  }
};

export const deleteLead = async (id: string): Promise<boolean> => {
  try {
    await apiRequest(`/api/leads/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Failed to delete lead:', error);
    // Fallback to localStorage
    return deleteLeadLocal(id);
  }
};

// Legacy localStorage functions for fallback
const getAllLeadsLocal = (): Lead[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('leads'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const createLeadLocal = (lead: Omit<Lead, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Lead => {
  const leads = getAllLeadsLocal();
  const newLead: Lead = {
    ...lead,
    id: `lead_${Date.now()}`,
    userId: getCurrentUserId() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  leads.push(newLead);
  safeStorage.setItem(getUserStorageKey('leads'), JSON.stringify(leads));
  addActivity(newLead.id, ActivityType.NOTE, 'Lead created');
  return newLead;
};

const updateLeadLocal = (id: string, updates: Partial<Lead>): Lead | null => {
  const leads = getAllLeadsLocal();
  const index = leads.findIndex(lead => lead.id === id);
  if (index === -1) return null;

  leads[index] = { ...leads[index], ...updates, updatedAt: new Date().toISOString() };
  safeStorage.setItem(getUserStorageKey('leads'), JSON.stringify(leads));
  return leads[index];
};

const deleteLeadLocal = (id: string): boolean => {
  const leads = getAllLeadsLocal();
  const filteredLeads = leads.filter(lead => lead.id !== id);
  if (filteredLeads.length === leads.length) return false;

  safeStorage.setItem(getUserStorageKey('leads'), JSON.stringify(filteredLeads));
  return true;
};

export const getLeadsByStatus = async (status: LeadStatus): Promise<Lead[]> => {
  const leads = await getAllLeads();
  return leads.filter((lead) => lead.status === status);
};

export const getLeadsByPriority = async (priority: Priority): Promise<Lead[]> => {
  const leads = await getAllLeads();
  return leads.filter((lead) => lead.priority === priority);
};

export const getTodayFollowUps = async (): Promise<Lead[]> => {
  try {
    const leads = await getAllLeads();
    const today = new Date().toISOString().split('T')[0];
    return leads.filter((lead) => {
      if (!lead.followUpDate) return false;
      try {
        // followUpDate is either YYYY-MM-DD string or ISO datetime string
        const dateStr = typeof lead.followUpDate === 'string' && lead.followUpDate.includes('T')
          ? lead.followUpDate.split('T')[0]
          : lead.followUpDate;
        return dateStr === today;
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('Failed to get today follow-ups:', error);
    return getTodayFollowUpsLocal();
  }
};

export const getUpcomingFollowUps = async (days: number = 7): Promise<Lead[]> => {
  try {
    const leads = await getAllLeads();
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    return leads.filter((lead) => lead.followUpDate && lead.followUpDate >= todayStr && lead.followUpDate <= futureDateStr);
  } catch (error) {
    console.error('Failed to get upcoming follow-ups:', error);
    return getUpcomingFollowUpsLocal(days);
  }
};

// Legacy local functions
const getTodayFollowUpsLocal = (): Lead[] => {
  const today = new Date().toISOString().split('T')[0];
  return getAllLeadsLocal().filter((lead) => lead.followUpDate === today);
};

const getUpcomingFollowUpsLocal = (days: number = 7): Lead[] => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];
  return getAllLeadsLocal().filter((lead) => lead.followUpDate && lead.followUpDate >= todayStr && lead.followUpDate <= futureDateStr);
};

// ========================
// ACTIVITIES OPERATIONS
// ========================

export const getAllActivities = async (): Promise<Activity[]> => {
  try {
    return await apiRequest('/api/activities');
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return getAllActivitiesLocal();
  }
};

export const getActivitiesByLeadId = async (leadId: string): Promise<Activity[]> => {
  try {
    const activities = await getAllActivities();
    return activities.filter(a => a.leadId === leadId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return getActivitiesByLeadIdLocal(leadId);
  }
};

export const addActivity = async (leadId: string, type: ActivityType, description: string): Promise<Activity> => {
  try {
    const newActivity = await apiRequest('/api/activities', {
      method: 'POST',
      body: JSON.stringify({ leadId, type, description }),
    });
    return newActivity;
  } catch (error) {
    console.error('Failed to create activity:', error);
    return addActivityLocal(leadId, type, description);
  }
};

// Legacy localStorage functions for activities
const getAllActivitiesLocal = (): Activity[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('activities'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getActivitiesByLeadIdLocal = (leadId: string): Activity[] => {
  return getAllActivitiesLocal().filter(a => a.leadId === leadId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const addActivityLocal = (leadId: string, type: ActivityType, description: string): Activity => {
  const activities = getAllActivitiesLocal();
  const newActivity: Activity = {
    id: `act_${Date.now()}`,
    userId: getCurrentUserId() || '',
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
  const activities = getAllActivitiesLocal();
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

export const createTask = (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Task => {
  const tasks = getAllTasks();
  const newTask: Task = {
    ...task,
    id: `task_${Date.now()}`,
    userId: getCurrentUserId() || '',
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

export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    const expenses = await apiRequest('/api/expenses');
    console.log('Fetched expenses from API:', expenses);
    return expenses;
  } catch (error) {
    console.error('Failed to fetch expenses from API:', error);
    console.log('Falling back to localStorage');
    return getAllExpensesLocal();
  }
};

export const createExpense = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>): Promise<Expense> => {
  try {
    console.log('Creating expense with data:', expense);
    const newExpense = await apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    console.log('Expense created successfully:', newExpense);
    return newExpense;
  } catch (error) {
    console.error('Failed to create expense:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return createExpenseLocal(expense);
  }
};

export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  try {
    const expenses = await getAllExpenses();
    return expenses.filter(e => e.date >= startDate && e.date <= endDate);
  } catch (error) {
    console.error('Failed to fetch expenses by date range:', error);
    return getExpensesByDateRangeLocal(startDate, endDate);
  }
};

export const getExpensesByType = async (type: ExpenseType): Promise<Expense[]> => {
  try {
    const expenses = await getAllExpenses();
    return expenses.filter(e => e.type === type);
  } catch (error) {
    console.error('Failed to fetch expenses by type:', error);
    return getExpensesByTypeLocal(type);
  }
};

export const deleteExpense = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to delete expense:', response.statusText);
      return deleteExpenseLocal(id);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return deleteExpenseLocal(id);
  }
};

// Legacy localStorage functions for expenses
const getAllExpensesLocal = (): Expense[] => {
  if (typeof window === 'undefined') return [];
  try {
    initializeUserData();
    const data = safeStorage.getItem(getUserStorageKey('expenses'));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const createExpenseLocal = (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>): Expense => {
  const expenses = getAllExpensesLocal();
  const newExpense: Expense = { ...expense, id: `exp_${Date.now()}`, userId: getCurrentUserId() || '', createdAt: new Date().toISOString() };
  expenses.push(newExpense);
  safeStorage.setItem(getUserStorageKey('expenses'), JSON.stringify(expenses));
  return newExpense;
};

const getExpensesByDateRangeLocal = (startDate: string, endDate: string): Expense[] => {
  return getAllExpensesLocal().filter(e => e.date >= startDate && e.date <= endDate);
};

const getExpensesByTypeLocal = (type: ExpenseType): Expense[] => {
  return getAllExpensesLocal().filter(e => e.type === type);
};

const deleteExpenseLocal = (id: string): boolean => {
  const expenses = getAllExpensesLocal();
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
    return data ? JSON.parse(data) : getDefaultTemplates();
  } catch {
    return getDefaultTemplates();
  }
};

export const getTemplateById = (id: string): Template | undefined => {
  return getAllTemplates().find(t => t.id === id);
};

export const createTemplate = (template: Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Template => {
  const templates = getAllTemplates();
  const newTemplate: Template = { ...template, id: `tpl_${Date.now()}`, userId: getCurrentUserId() || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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

export const getSourceAnalytics = async (): Promise<SourceAnalytics[]> => {
  return getSourceAnalyticsLocal();
};

// Legacy local function
const getSourceAnalyticsLocal = (): SourceAnalytics[] => {
  const leads = getAllLeadsLocal();
  const sourceMap = new Map<string, { count: number; revenue: number }>();

  leads.forEach(lead => {
    const source = lead.source || 'Unknown';
    const current = sourceMap.get(source) || { count: 0, revenue: 0 };
    sourceMap.set(source, {
      count: current.count + 1,
      revenue: current.revenue + (lead.revenue || 0)
    });
  });

  const totalLeads = leads.length;
  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.count,
      revenue: data.revenue,
      percentage: totalLeads > 0 ? Math.round((data.count / totalLeads) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
};

export const getRevenueForecast = async (): Promise<ForecastData[]> => {
  const leads = await getAllLeads();
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

export const calculateTotalRevenue = async (): Promise<number> => {
  const leads = await getAllLeads();
  return leads.reduce((sum, lead) => sum + (lead.revenue || 0), 0);
};
export const calculateTotalExpenses = async (): Promise<number> => {
  const expenses = await getAllExpenses();
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};
export const calculateProfit = async (): Promise<number> => {
  const [revenue, expenses] = await Promise.all([calculateTotalRevenue(), calculateTotalExpenses()]);
  return revenue - expenses;
};
export const calculateAdsExpenses = async (): Promise<number> => {
  const expenses = await getAllExpenses();
  return expenses.filter(e => e.type === ExpenseType.META_ADS).reduce((sum, e) => sum + e.amount, 0);
};
export const calculateROI = async (): Promise<number> => {
  const [adsExpenses, totalRevenue] = await Promise.all([calculateAdsExpenses(), calculateTotalRevenue()]);
  if (adsExpenses === 0) return 0;
  return ((totalRevenue - adsExpenses) / adsExpenses) * 100;
};

export const getFinancialSummary = async () => {
  try {
    const [leads, expenses] = await Promise.all([
      getAllLeads(),
      getAllExpenses(),
    ]);
    
    const totalRevenue = leads
      .filter(l => l.status === LeadStatus.CLOSED_WON && l.revenue)
      .reduce((sum, l) => sum + (l.revenue || 0), 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    
    const adExpenses = expenses
      .filter(e => e.type === ExpenseType.META_ADS)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const roiFromAds = adExpenses > 0 ? Math.round(((totalRevenue - totalExpenses) / adExpenses) * 100) : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      profit,
      roiFromAds,
    };
  } catch (error) {
    console.error('Failed to get financial summary:', error);
    // Fallback to local calculations
    return {
      totalRevenue: calculateTotalRevenueLocal(),
      totalExpenses: calculateTotalExpensesLocal(),
      profit: calculateProfitLocal(),
      roiFromAds: calculateROILocal(),
    };
  }
};

export const invalidateCache = (key?: string) => {
  if (key) {
    responseCache.delete(key);
  } else {
    responseCache.clear();
  }
};

// Legacy local calculation functions
const calculateTotalRevenueLocal = (): number => {
  return getAllLeadsLocal().reduce((sum, lead) => sum + (lead.revenue || 0), 0);
};

const calculateTotalExpensesLocal = (): number => {
  return getAllExpensesLocal().reduce((sum, expense) => sum + expense.amount, 0);
};

const calculateProfitLocal = (): number => {
  return calculateTotalRevenueLocal() - calculateTotalExpensesLocal();
};

const calculateAdsExpensesLocal = (): number => {
  return getAllExpensesLocal().filter(e => e.type === ExpenseType.META_ADS).reduce((sum, e) => sum + e.amount, 0);
};

const calculateROILocal = (): number => {
  const adsExpenses = calculateAdsExpensesLocal();
  if (adsExpenses === 0) return 0;
  return ((calculateTotalRevenueLocal() - adsExpenses) / adsExpenses) * 100;
};

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
