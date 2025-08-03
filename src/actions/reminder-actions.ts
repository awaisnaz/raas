'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reminderSchema } from '@/lib/validations';
import { ReminderFormInput } from '@/types';
import { reminderService } from '@/lib/reminder-job';

// Create a new reminder
export async function createReminder(data: ReminderFormInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Validate data
    const validatedData = reminderSchema.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.format();
      
      // Return specific field errors
      if (errors.eventId?._errors[0]) {
        return { error: `Event ID: ${errors.eventId._errors[0]}` };
      }
      if (errors.reminderTime?._errors[0]) {
        return { error: `Reminder Time: ${errors.reminderTime._errors[0]}` };
      }
      
      return { error: 'Please check your reminder details and try again.' };
    }

    // Get the event to check if reminder time is valid
    const event = await prisma.event.findFirst({
      where: {
        id: validatedData.data.eventId,
        userId,
      },
    });

    if (!event) {
      return { error: 'Event not found or you do not have permission to add a reminder.' };
    }

    // Check if reminder time is valid (15 min to 7 days before event)
    const fifteenMinutes = 15 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const timeBeforeEvent = event.date.getTime() - validatedData.data.reminderTime.getTime();

    if (timeBeforeEvent < fifteenMinutes || timeBeforeEvent > sevenDays) {
      return { error: 'Reminder must be between 15 minutes and 7 days before the event.' };
    }

    // Check if reminder already exists for this event and user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        eventId: validatedData.data.eventId,
        userId,
      },
    });

    if (existingReminder) {
      return { error: 'A reminder already exists for this event.' };
    }

    // Create new reminder
    const reminder = await prisma.reminder.create({
      data: {
        reminderTime: validatedData.data.reminderTime,
        eventId: validatedData.data.eventId,
        userId,
      },
    });

    // Schedule background job for sending the reminder
    await reminderService.scheduleReminder(
      reminder.id,
      event.id,
      userId,
      event.title,
      event.date,
      validatedData.data.reminderTime
    );

    // Log notification
    console.log(`[REMINDER] Event: ${event.title}, User: ${userId}, Time: ${formatRelativeTime(timeBeforeEvent)}`);

    console.log('[CACHE] Revalidating after reminder creation', {
      eventId: validatedData.data.eventId,
      reminderId: reminder.id,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    revalidatePath('/events');
    revalidatePath(`/events/${validatedData.data.eventId}`);
    revalidateTag('events');
    console.log('[CACHE] Revalidation completed after reminder creation');

    return { success: true, data: { ...reminder, userId } };
  } catch (error) {
    console.error('Error creating reminder:', error);
    return { error: 'Failed to create reminder. Please try again.' };
  }
}

// Update an existing reminder
export async function updateReminder(reminderId: string, data: ReminderFormInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Validate data
    const validatedData = reminderSchema.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.format();
      
      // Return specific field errors
      if (errors.eventId?._errors[0]) {
        return { error: `Event ID: ${errors.eventId._errors[0]}` };
      }
      if (errors.reminderTime?._errors[0]) {
        return { error: `Reminder Time: ${errors.reminderTime._errors[0]}` };
      }
      
      return { error: 'Please check your reminder details and try again.' };
    }

    // Get the event to check if reminder time is valid
    const event = await prisma.event.findFirst({
      where: {
        id: validatedData.data.eventId,
        userId,
      },
    });

    if (!event) {
      return { error: 'Event not found or you do not have permission to update this reminder.' };
    }

    // Check if reminder time is valid (15 min to 7 days before event)
    const fifteenMinutes = 15 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const timeBeforeEvent = event.date.getTime() - validatedData.data.reminderTime.getTime();

    if (timeBeforeEvent < fifteenMinutes || timeBeforeEvent > sevenDays) {
      return { error: 'Reminder must be between 15 minutes and 7 days before the event.' };
    }

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (!existingReminder) {
      return { error: 'Reminder not found or you do not have permission to update it.' };
    }

    // Update reminder
    const reminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: { reminderTime: validatedData.data.reminderTime },
    });

    // Update background job for the reminder
    await reminderService.updateReminder(
      reminder.id,
      validatedData.data.reminderTime
    );

    // Log notification
    console.log(`[REMINDER] Event: ${event.title}, User: ${userId}, Time: ${formatRelativeTime(timeBeforeEvent)}`);

    console.log('[CACHE] Revalidating after reminder update', {
      eventId: validatedData.data.eventId,
      reminderId,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    revalidatePath('/events');
    revalidatePath(`/events/${validatedData.data.eventId}`);
    revalidateTag('events');
    console.log('[CACHE] Revalidation completed after reminder update');

    return { success: true, data: { ...reminder, userId } };
  } catch (error) {
    console.error('Error updating reminder:', error);
    return { error: 'Failed to update reminder. Please try again.' };
  }
}

// Create or update a reminder (legacy function)
export async function createOrUpdateReminder(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Parse and validate form data
    const rawData = {
      eventId: formData.get('eventId') as string,
      reminderTime: new Date(formData.get('reminderTime') as string),
    };

    const validatedData = reminderSchema.safeParse(rawData);

    if (!validatedData.success) {
      const errors = validatedData.error.format();
      
      // Return specific field errors
      if (errors.eventId?._errors[0]) {
        return { error: `Event ID: ${errors.eventId._errors[0]}` };
      }
      if (errors.reminderTime?._errors[0]) {
        return { error: `Reminder Time: ${errors.reminderTime._errors[0]}` };
      }
      
      return { error: 'Please check your reminder details and try again.' };
    }

    // Get the event to check if reminder time is valid
    const event = await prisma.event.findFirst({
      where: {
        id: validatedData.data.eventId,
        userId,
      },
    });

    if (!event) {
      return { error: 'Event not found or you do not have permission to add a reminder.' };
    }

    // Check if reminder time is valid (15 min to 7 days before event)
    const fifteenMinutes = 15 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const timeBeforeEvent = event.date.getTime() - validatedData.data.reminderTime.getTime();

    if (timeBeforeEvent < fifteenMinutes || timeBeforeEvent > sevenDays) {
      return { error: 'Reminder must be between 15 minutes and 7 days before the event.' };
    }

    // Check if reminder already exists for this event and user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        eventId: validatedData.data.eventId,
        userId,
      },
    });

    let reminder;

    if (existingReminder) {
      // Update existing reminder
      reminder = await prisma.reminder.update({
        where: { id: existingReminder.id },
        data: { reminderTime: validatedData.data.reminderTime },
      });
    } else {
      // Create new reminder
      reminder = await prisma.reminder.create({
        data: {
          reminderTime: validatedData.data.reminderTime,
          eventId: validatedData.data.eventId,
          userId,
        },
      });
    }

    // Log notification
    console.log(`[REMINDER] Event: ${event.title}, User: ${userId}, Time: ${formatRelativeTime(timeBeforeEvent)}`);

    console.log('[CACHE] Revalidating after reminder create/update', {
      eventId: validatedData.data.eventId,
      reminderId: reminder.id,
      wasUpdate: !!existingReminder,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    revalidatePath('/events');
    revalidatePath(`/events/${validatedData.data.eventId}`);
    revalidateTag('events');
    console.log('[CACHE] Revalidation completed after reminder create/update');

    return { success: true, reminder };
  } catch (error) {
    console.error('Error creating/updating reminder:', error);
    return { error: 'Failed to create/update reminder. Please try again.' };
  }
}

// Delete a reminder
export async function deleteReminder(reminderId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Session expired, please log in again.' };
    }

    const userId = session.user.id;

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
      include: {
        event: true,
      },
    });

    if (!existingReminder) {
      return { error: 'Reminder not found or you do not have permission to delete it.' };
    }

    // Delete reminder
    await prisma.reminder.delete({
      where: { id: reminderId },
    });

    // Cancel background job for the reminder
    await reminderService.cancelReminder(reminderId);

    console.log('[CACHE] Revalidating after reminder deletion', {
      eventId: existingReminder.eventId,
      reminderId,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    revalidatePath('/events');
    revalidatePath(`/events/${existingReminder.eventId}`);
    revalidateTag('events');
    console.log('[CACHE] Revalidation completed after reminder deletion');

    return { success: true };
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return { error: 'Failed to delete reminder. Please try again.' };
  }
}

// Helper function to format relative time
function formatRelativeTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (60 * 1000));
  
  if (minutes < 60) {
    return `${minutes}m before`;
  }
  
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours}h before`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d before`;
}