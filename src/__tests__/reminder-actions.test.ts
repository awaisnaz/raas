import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createReminder, updateReminder, deleteReminder } from '@/actions/reminder-actions';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addHours, addDays, addMinutes } from 'date-fns';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findFirst: jest.fn(),
    },
    reminder: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Reminder Actions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  const mockEvent = {
    id: 'event-123',
    title: 'Test Event',
    date: addDays(new Date(), 2), // Event in 2 days
    userId: 'user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createReminder', () => {
    it('should create a reminder successfully with valid data', async () => {
      const reminderData = {
        eventId: 'event-123',
        reminderTime: addHours(mockEvent.date, -2), // 2 hours before event
      };

      mockPrisma.event.findFirst.mockResolvedValue(mockEvent as any);
      mockPrisma.reminder.findFirst.mockResolvedValue(null); // No existing reminder
      mockPrisma.reminder.create.mockResolvedValue({
        id: 'reminder-123',
        ...reminderData,
        userId: 'user-123',
      } as any);

      const result = await createReminder(reminderData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPrisma.reminder.create).toHaveBeenCalledWith({
        data: {
          reminderTime: reminderData.reminderTime,
          eventId: reminderData.eventId,
          userId: 'user-123',
        },
      });
    });

    it('should reject reminder if time is less than 15 minutes before event', async () => {
      const reminderData = {
        eventId: 'event-123',
        reminderTime: addMinutes(mockEvent.date, -10), // 10 minutes before (invalid)
      };

      mockPrisma.event.findFirst.mockResolvedValue(mockEvent as any);

      const result = await createReminder(reminderData);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Reminder must be between 15 minutes and 7 days before the event.');
      expect(mockPrisma.reminder.create).not.toHaveBeenCalled();
    });

    it('should reject reminder if time is more than 7 days before event', async () => {
      const reminderData = {
        eventId: 'event-123',
        reminderTime: addDays(mockEvent.date, -8), // 8 days before (invalid)
      };

      mockPrisma.event.findFirst.mockResolvedValue(mockEvent as any);

      const result = await createReminder(reminderData);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Reminder must be between 15 minutes and 7 days before the event.');
      expect(mockPrisma.reminder.create).not.toHaveBeenCalled();
    });

    it('should reject if reminder already exists for the event', async () => {
      const reminderData = {
        eventId: 'event-123',
        reminderTime: addHours(mockEvent.date, -2),
      };

      mockPrisma.event.findFirst.mockResolvedValue(mockEvent as any);
      mockPrisma.reminder.findFirst.mockResolvedValue({
        id: 'existing-reminder',
        eventId: 'event-123',
        userId: 'user-123',
      } as any);

      const result = await createReminder(reminderData);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('A reminder already exists for this event.');
      expect(mockPrisma.reminder.create).not.toHaveBeenCalled();
    });

    it('should return session expired error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const reminderData = {
        eventId: 'event-123',
        reminderTime: addHours(mockEvent.date, -2),
      };

      const result = await createReminder(reminderData);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Session expired, please log in again.');
      expect(mockPrisma.event.findFirst).not.toHaveBeenCalled();
    });

    it('should reject if event does not exist or user does not have permission', async () => {
      const reminderData = {
        eventId: 'non-existent-event',
        reminderTime: addHours(new Date(), 2),
      };

      mockPrisma.event.findFirst.mockResolvedValue(null);

      const result = await createReminder(reminderData);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Event not found or you do not have permission to add a reminder.');
      expect(mockPrisma.reminder.create).not.toHaveBeenCalled();
    });
  });

  describe('updateReminder', () => {
    it('should update reminder successfully', async () => {
      const reminderData = {
        eventId: 'event-123',
        reminderTime: addHours(mockEvent.date, -4), // 4 hours before event
      };

      mockPrisma.event.findFirst.mockResolvedValue(mockEvent as any);
      mockPrisma.reminder.findFirst.mockResolvedValue({
        id: 'reminder-123',
        eventId: 'event-123',
        userId: 'user-123',
      } as any);
      mockPrisma.reminder.update.mockResolvedValue({
        id: 'reminder-123',
        ...reminderData,
        userId: 'user-123',
      } as any);

      const result = await updateReminder('reminder-123', reminderData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-123' },
        data: { reminderTime: reminderData.reminderTime },
      });
    });

    it('should reject update if reminder does not exist', async () => {
      const reminderData = {
        eventId: 'event-123',
        reminderTime: addHours(mockEvent.date, -2),
      };

      mockPrisma.event.findFirst.mockResolvedValue(mockEvent as any);
      mockPrisma.reminder.findFirst.mockResolvedValue(null);

      const result = await updateReminder('non-existent-reminder', reminderData);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Reminder not found or you do not have permission to update it.');
      expect(mockPrisma.reminder.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder successfully', async () => {
      mockPrisma.reminder.findFirst.mockResolvedValue({
        id: 'reminder-123',
        eventId: 'event-123',
        userId: 'user-123',
        event: mockEvent,
      } as any);
      mockPrisma.reminder.delete.mockResolvedValue({} as any);

      const result = await deleteReminder('reminder-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.reminder.delete).toHaveBeenCalledWith({
        where: { id: 'reminder-123' },
      });
    });

    it('should reject delete if reminder does not exist', async () => {
      mockPrisma.reminder.findFirst.mockResolvedValue(null);

      const result = await deleteReminder('non-existent-reminder');

      expect(result.success).toBeUndefined();
      expect(result.error).toBe('Reminder not found or you do not have permission to delete it.');
      expect(mockPrisma.reminder.delete).not.toHaveBeenCalled();
    });
  });
});