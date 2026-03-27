import { z } from 'zod';

// Authentication Validation
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain lowercase, uppercase, and number'
  ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain lowercase, uppercase, and number'
  ),
});

// Lead Validation
const dateInputSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be yyyy-mm-dd or ISO datetime'),
]);

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  contact: z.string().min(1, 'Contact is required').max(255),
  source: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  followUpDate: z.union([dateInputSchema, z.literal('')]).optional(),
  lastMessage: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  revenue: z.number().min(0).default(0),
});

export const updateLeadSchema = createLeadSchema.partial();

// Expense Validation
export const createExpenseSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().max(500).optional(),
});

// Template Validation
export const createTemplateSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  category: z.string().min(1, 'Category is required').max(100),
});

// Task Validation
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  dueDate: z.string().datetime(),
  leadId: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
