import { z } from 'zod';
import { EventStatus } from '@prisma/client';

// Event validation schema for server actions
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  date: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Date must be in the future',
  }),
  location: z.string().min(1, 'Location is required').refine(
    (location) => /^[A-Za-z]{2}-[A-Za-z]{2,3}:/.test(location),
    {
      message: 'Location must include country code prefix (e.g., "US-NY: New York")',
    }
  ),
  status: z.nativeEnum(EventStatus, {
    message: 'Please select a valid status',
  }),
});

// Event form validation schema for client-side forms
export const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
  date: z.date().refine((date) => date > new Date(), {
    message: 'Date must be in the future',
  }),
  location: z.string().min(1, 'Location is required').refine(
    (location) => /^[A-Za-z]{2}-[A-Za-z]{2,3}:/.test(location),
    {
      message: 'Location must include country code prefix (e.g., "US-NY: New York")',
    }
  ),
  status: z.nativeEnum(EventStatus, {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
});

// Reminder validation schema for server actions
export const reminderSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  reminderTime: z.coerce.date(),
}).refine(
  (data) => {
    // This will be validated in the server action with the actual event date
    return true;
  },
  {
    message: 'Reminder must be between 15 minutes and 7 days before the event',
    path: ['reminderTime'],
  }
);

// Reminder form validation schema for client-side forms
export const reminderFormSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  reminderTime: z.date(),
}).refine(
  (data) => {
    // This will be validated in the server action with the actual event date
    return true;
  },
  {
    message: 'Reminder must be between 15 minutes and 7 days before the event',
    path: ['reminderTime'],
  }
);

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Registration validation schema
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Event filter validation schema
export const eventFilterSchema = z.object({
  status: z.nativeEnum(EventStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  hasReminder: z.boolean().optional(),
  search: z.string().optional(),
});

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});