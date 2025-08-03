'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventSchema, paginationSchema, eventFilterSchema } from '@/lib/validations';
import { EventStatus } from '@prisma/client';
import { EventTableFilters, PaginationParams, EventsResponse } from '@/types';

// Create a new event
export async function createEvent(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Parse and validate form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: new Date(formData.get('date') as string),
      location: formData.get('location') as string,
      status: formData.get('status') as EventStatus,
    };

    const validatedData = eventSchema.safeParse(rawData);

    if (!validatedData.success) {
      const errors = validatedData.error.format();
      
      // Return specific field errors
      if (errors.title?._errors[0]) {
        return { error: `Title: ${errors.title._errors[0]}` };
      }
      if (errors.description?._errors[0]) {
        return { error: `Description: ${errors.description._errors[0]}` };
      }
      if (errors.date?._errors[0]) {
        return { error: `Date: ${errors.date._errors[0]}` };
      }
      if (errors.location?._errors[0]) {
        return { error: `Location: ${errors.location._errors[0]}` };
      }
      if (errors.status?._errors[0]) {
        return { error: `Status: ${errors.status._errors[0]}` };
      }
      
      return { error: 'Please check your input and try again.' };
    }

    // Check for duplicate event
    const existingEvent = await prisma.event.findFirst({
      where: {
        title: validatedData.data.title,
        date: validatedData.data.date,
        userId,
      },
    });

    if (existingEvent) {
      return { error: 'Event with this title and date already exists.' };
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        ...validatedData.data,
        userId,
      },
    });

    console.log('[CACHE] Revalidating after event creation', {
        eventId: result.id,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack?.split('\n').slice(1, 3)
      });
      revalidatePath('/events');
      revalidateTag('events');
      console.log('[CACHE] Revalidation completed after event creation');

    return { success: true, event };
  } catch (error: unknown) {
    console.error('Error creating event:', error);
    return { error: 'Failed to create event. Please try again.' };
  }
}

// Update an existing event
export async function updateEvent(eventId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Parse and validate form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: new Date(formData.get('date') as string),
      location: formData.get('location') as string,
      status: formData.get('status') as EventStatus,
    };

    const validatedData = eventSchema.safeParse(rawData);

    if (!validatedData.success) {
      const errors = validatedData.error.format();
      
      // Return specific field errors
      if (errors.title?._errors[0]) {
        return { error: `Title: ${errors.title._errors[0]}` };
      }
      if (errors.description?._errors[0]) {
        return { error: `Description: ${errors.description._errors[0]}` };
      }
      if (errors.date?._errors[0]) {
        return { error: `Date: ${errors.date._errors[0]}` };
      }
      if (errors.location?._errors[0]) {
        return { error: `Location: ${errors.location._errors[0]}` };
      }
      if (errors.status?._errors[0]) {
        return { error: `Status: ${errors.status._errors[0]}` };
      }
      
      return { error: 'Please check your input and try again.' };
    }

    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
      include: {
        reminders: true,
      },
    });

    if (!existingEvent) {
      return { error: 'Event not found or you do not have permission to edit it.' };
    }

    // Check for duplicate event (excluding the current event)
    const duplicateEvent = await prisma.event.findFirst({
      where: {
        title: validatedData.data.title,
        date: validatedData.data.date,
        userId,
        id: { not: eventId },
      },
    });

    if (duplicateEvent) {
      return { error: 'Event with this title and date already exists.' };
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: validatedData.data,
    });

    // If date changed, check if reminders need to be adjusted
    if (existingEvent.date.getTime() !== validatedData.data.date.getTime() && existingEvent.reminders.length > 0) {
      for (const reminder of existingEvent.reminders) {
        // Calculate time difference between reminder and event
        const timeDiff = existingEvent.date.getTime() - reminder.reminderTime.getTime();
        
        // Apply same time difference to new event date
        const newReminderTime = new Date(validatedData.data.date.getTime() - timeDiff);
        
        // Check if new reminder time is valid (15 min to 7 days before event)
        const fifteenMinutes = 15 * 60 * 1000;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const timeBeforeEvent = validatedData.data.date.getTime() - newReminderTime.getTime();
        
        if (timeBeforeEvent >= fifteenMinutes && timeBeforeEvent <= sevenDays) {
          // Update reminder
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { reminderTime: newReminderTime },
          });
        } else {
          // Delete reminder if it becomes invalid
          await prisma.reminder.delete({
            where: { id: reminder.id },
          });
        }
      }
    }

    console.log('[CACHE] Revalidating after event update', {
        eventId,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack?.split('\n').slice(1, 3)
      });
      revalidatePath('/events');
      revalidatePath(`/events/${eventId}`);
      revalidateTag('events');
      console.log('[CACHE] Revalidation completed after event update');

    return { success: true, event };
  } catch (error: unknown) {
    console.error('Error updating event:', error);
    return { error: 'Failed to update event. Please try again.' };
  }
}

// Delete an event
export async function deleteEvent(eventId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
    });

    if (!existingEvent) {
      return { error: 'Event not found or you do not have permission to delete it.' };
    }

    // Delete event (reminders will be cascade deleted due to the relation)
    await prisma.event.delete({
      where: { id: eventId },
    });

    console.log('[CACHE] Revalidating after event deletion', {
      eventId,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    revalidatePath('/events');
    revalidateTag('events');
    console.log('[CACHE] Revalidation completed after event deletion');

    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting event:', error);
    return { error: 'Failed to delete event. Please try again.' };
  }
}

// Get events with pagination, sorting, and filtering
// Cached version of getEvents to prevent continuous database queries
const getCachedEvents = unstable_cache(
  async (userId: string | undefined, params: PaginationParams, filters: EventTableFilters) => {
    const cacheKey = [
      'events',
      userId || 'anonymous',
      `page-${params.page}`,
      `size-${params.pageSize}`,
      `sort-${params.sortBy}-${params.sortOrder}`,
      `status-${filters.status || 'all'}`,
      `search-${filters.search || 'none'}`,
      `dates-${filters.startDate?.toISOString() || 'none'}-${filters.endDate?.toISOString() || 'none'}`,
      `reminder-${filters.hasReminder || 'all'}`
    ];
    
    console.log('[CACHE] getCachedEvents - CACHE MISS - executing database query', {
      userId,
      params,
      filters,
      cacheKey: cacheKey.join(':'),
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 5)
    });
    
    const result = await getEventsInternal(userId, params, filters);
    
    console.log('[CACHE] getCachedEvents - database query completed', {
      resultCount: result.events.length,
      totalCount: result.totalCount,
      cacheKey: cacheKey.join(':'),
      timestamp: new Date().toISOString()
    });
    
    return result;
  },
  // Create unique cache keys based on the parameters
  (userId, params, filters) => {
    const cacheKey = [
      'events',
      userId || 'anonymous',
      `page-${params.page}`,
      `size-${params.pageSize}`,
      `sort-${params.sortBy}-${params.sortOrder}`,
      `status-${filters.status || 'all'}`,
      `search-${filters.search || 'none'}`,
      `dates-${filters.startDate?.toISOString() || 'none'}-${filters.endDate?.toISOString() || 'none'}`,
      `reminder-${filters.hasReminder || 'all'}`
    ];
    
    console.log('[CACHE] Cache key generated:', {
      cacheKey: cacheKey.join(':'),
      userId,
      params,
      filters,
      timestamp: new Date().toISOString()
    });
    
    return cacheKey;
  },
  {
    tags: ['events'],
    revalidate: 300, // Cache for 5 minutes
  }
);

export async function getEvents(
  params: PaginationParams,
  filters: EventTableFilters = {}
): Promise<EventsResponse> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    console.log('[CACHE] getEvents called - checking cache first', {
      userId,
      page: params.page,
      pageSize: params.pageSize,
      filters,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    
    const startTime = Date.now();
    const result = await getCachedEvents(userId, params, filters);
    const endTime = Date.now();
    
    console.log('[CACHE] getEvents completed', {
      userId,
      executionTime: `${endTime - startTime}ms`,
      resultCount: result.events.length,
      totalCount: result.totalCount,
      wasCached: endTime - startTime < 50, // If very fast, likely cached
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error: unknown) {
    console.error('[CACHE] Error fetching events:', error);
    return { events: [], totalCount: 0, totalPages: 0 };
  }
}

// Internal function that does the actual database work
async function getEventsInternal(
  userId: string | undefined,
  params: PaginationParams,
  filters: EventTableFilters = {}
): Promise<EventsResponse> {
  try {

    // Validate pagination params
    const validatedParams = paginationSchema.parse(params);
    const { page, pageSize, sortBy = 'date', sortOrder = 'asc' } = validatedParams;

    // Validate filters
    const validatedFilters = eventFilterSchema.parse(filters);

    // Build where clause
    const where: Record<string, unknown> = {};

    // If authenticated, show user's events, otherwise only show published events
    if (userId) {
      where.userId = userId;
    } else {
      where.status = EventStatus.PUBLISHED;
    }

    // Apply filters
    if (validatedFilters.status) {
      where.status = validatedFilters.status;
    }

    if (validatedFilters.startDate || validatedFilters.endDate) {
      const dateFilter: any = {};
      if (validatedFilters.startDate) {
        dateFilter.gte = validatedFilters.startDate;
      }
      if (validatedFilters.endDate) {
        dateFilter.lte = validatedFilters.endDate;
      }
      where.date = dateFilter;
    }

    // Create separate where clauses for count and findMany
    // count() doesn't support mode argument, but findMany() does
    const whereForCount = { ...where };
    const whereForQuery = { ...where };

    if (validatedFilters.search) {
      // SQLite doesn't support mode parameter, so we use the same query for both
      const searchFilter = [
        { title: { contains: validatedFilters.search } },
        { location: { contains: validatedFilters.search } },
      ];
      
      whereForCount.OR = searchFilter;
      whereForQuery.OR = searchFilter;
    }

    // Handle hasReminder filter
    const includeReminders = {
      reminders: {
        where: userId ? { userId } : undefined,
      },
    };

    // Count total events matching filters
    const totalCount = await prisma.event.count({ where: whereForCount });
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get events with pagination and sorting
    const events = await prisma.event.findMany({
      where: whereForQuery,
      include: includeReminders,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });

    // Transform data for response
    const eventsWithReminder = events.map(event => ({
      ...event,
      reminder: event.reminders?.[0] || null,
      reminders: undefined, // Remove the reminders array
    }));

    // Filter by hasReminder if needed
    const filteredEvents = validatedFilters.hasReminder !== undefined
      ? eventsWithReminder.filter(event => 
          validatedFilters.hasReminder ? !!event.reminder : !event.reminder
        )
      : eventsWithReminder;

    return {
      events: filteredEvents,
      totalCount: filteredEvents.length !== eventsWithReminder.length 
        ? filteredEvents.length 
        : totalCount,
      totalPages: filteredEvents.length !== eventsWithReminder.length
        ? Math.ceil(filteredEvents.length / pageSize)
        : totalPages,
    };
  } catch (error: unknown) {
    console.error('Error fetching events:', error);
    return { events: [], totalCount: 0, totalPages: 0 };
  }
}

// Get a single event by ID
export async function getEventById(eventId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const where: Record<string, unknown> = { id: eventId };

    // If not authenticated, only show published events
    if (!userId) {
      where.status = EventStatus.PUBLISHED;
    }

    const event = await prisma.event.findFirst({
      where,
      include: {
        reminders: userId ? { where: { userId } } : false,
      },
    });

    if (!event) {
      return { error: 'Event not found' };
    }

    // Transform data for response
    const eventWithReminder = {
      ...event,
      reminder: event.reminders?.[0] || null,
      reminders: undefined, // Remove the reminders array
    };

    return { event: eventWithReminder };
  } catch (error: unknown) {
    console.error('Error fetching event:', error);
    return { error: 'Failed to fetch event' };
  }
}