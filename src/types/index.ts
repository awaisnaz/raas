import { EventStatus } from '@prisma/client';

// Extend the next-auth session type
declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  location: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface EventWithReminder extends Event {
  reminder?: Reminder | null;
}

// Reminder types
export interface Reminder {
  id: string;
  reminderTime: Date;
  createdAt: Date;
  updatedAt: Date;
  eventId: string;
  userId: string;
}

// Form input types
export interface EventFormInput {
  title: string;
  description?: string | null;
  date: Date;
  location: string;
  status: EventStatus;
}

export interface ReminderFormInput {
  reminderTime: Date;
  eventId: string;
}

// Table types
export interface EventTableFilters {
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  hasReminder?: boolean;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EventsResponse {
  events: EventWithReminder[];
  totalCount: number;
  totalPages: number;
}