/**
 * Mock Background Job for Sending Reminders
 * 
 * This simulates a production reminder service that would typically run
 * as a separate background process or microservice using message queues
 * like Redis Bull, AWS SQS, or similar technologies.
 */

import { PrismaClient } from '@prisma/client';
import { addMinutes } from 'date-fns';

const prisma = new PrismaClient();

interface ReminderJob {
  id: string;
  eventId: string;
  userId: string;
  eventTitle: string;
  eventDate: Date;
  reminderTime: Date;
  status: 'pending' | 'sent' | 'failed';
}

class MockReminderService {
  private jobs: Map<string, ReminderJob> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the background job processor
   * In production, this would be a separate service/worker
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[REMINDER SERVICE] Starting background job processor at:', new Date().toISOString());
    
    // Check for pending reminders every 5 minutes to reduce load
    this.intervalId = setInterval(() => {
      console.log('[REMINDER SERVICE] Interval triggered - processing reminders at:', new Date().toISOString());
      this.processReminders();
    }, 5 * 60 * 1000); // 5 minutes instead of 30 seconds
    
    // Initial check
    console.log('[REMINDER SERVICE] Processing reminders immediately on startup');
    this.processReminders();
  }

  /**
   * Stop the background job processor
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[REMINDER SERVICE] Background job processor stopped.');
  }

  /**
   * Schedule a reminder job
   */
  async scheduleReminder(reminderId: string, eventId: string, userId: string, eventTitle: string, eventDate: Date, reminderTime: Date) {
    const job: ReminderJob = {
      id: reminderId,
      eventId,
      userId,
      eventTitle,
      eventDate,
      reminderTime,
      status: 'pending'
    };
    
    this.jobs.set(reminderId, job);
    
    console.log(`[REMINDER SERVICE] Scheduled reminder for event "${eventTitle}" at ${reminderTime.toISOString()}`);
    
    // In production, this would add the job to a message queue
    // Example: await this.messageQueue.add('send-reminder', job, { delay: reminderTime.getTime() - Date.now() });
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string) {
    if (this.jobs.has(reminderId)) {
      this.jobs.delete(reminderId);
      console.log(`[REMINDER SERVICE] Cancelled reminder ${reminderId}`);
    }
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(reminderId: string, newReminderTime: Date) {
    const job = this.jobs.get(reminderId);
    if (job) {
      job.reminderTime = newReminderTime;
      job.status = 'pending'; // Reset status in case it was failed
      console.log(`[REMINDER SERVICE] Updated reminder ${reminderId} to ${newReminderTime.toISOString()}`);
    }
  }

  /**
   * Process pending reminders
   * This simulates checking the database and sending notifications
   */
  private async processReminders() {
    console.log('[REMINDER_SERVICE] processReminders started at:', new Date().toISOString());
    const now = new Date();
    
    console.log('[REMINDER_SERVICE] Querying in-memory jobs for pending reminders');
    const pendingJobs = Array.from(this.jobs.values()).filter(
      job => job.status === 'pending' && job.reminderTime <= now
    );

    console.log(`[REMINDER_SERVICE] Found ${pendingJobs.length} pending reminders at:`, new Date().toISOString());
    
    if (pendingJobs.length === 0) {
      console.log('[REMINDER_SERVICE] No pending reminders to process');
      return;
    }

    console.log(`[REMINDER SERVICE] Processing ${pendingJobs.length} pending reminders...`);

    for (const job of pendingJobs) {
      try {
        console.log('[REMINDER_SERVICE] Processing reminder:', job.id);
        await this.sendReminder(job);
        job.status = 'sent';
        
        // Remove completed jobs after 1 hour to prevent memory leaks
        setTimeout(() => {
          this.jobs.delete(job.id);
        }, 60 * 60 * 1000);
        
      } catch (error) {
        console.error(`[REMINDER SERVICE] Failed to send reminder ${job.id}:`, error);
        job.status = 'failed';
        
        // Retry failed jobs after 5 minutes
        setTimeout(() => {
          if (this.jobs.has(job.id)) {
            const retryJob = this.jobs.get(job.id)!;
            retryJob.status = 'pending';
            retryJob.reminderTime = addMinutes(new Date(), 5);
          }
        }, 5 * 60 * 1000);
      }
    }
    
    console.log('[REMINDER_SERVICE] processReminders completed at:', new Date().toISOString());
  }

  /**
   * Send the actual reminder notification
   * In production, this would integrate with email/SMS/push notification services
   */
  private async sendReminder(job: ReminderJob) {
    // Simulate notification sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const timeUntilEvent = Math.floor(
      (job.eventDate.getTime() - Date.now()) / (1000 * 60)
    );
    
    const relativeTime = timeUntilEvent >= 60 
      ? `${Math.floor(timeUntilEvent / 60)}h ${timeUntilEvent % 60}m`
      : `${timeUntilEvent}m`;
    
    // Mock notification content
    const notification = {
      to: job.userId,
      subject: `Reminder: ${job.eventTitle}`,
      message: `Your event "${job.eventTitle}" is starting in ${relativeTime}.`,
      eventId: job.eventId,
      timestamp: new Date().toISOString()
    };
    
    // Log the "sent" notification
    console.log(`[REMINDER SENT] ${JSON.stringify(notification)}`);
    
    // In production, you would:
    // - Send email via SendGrid, AWS SES, etc.
    // - Send push notification via Firebase, OneSignal, etc.
    // - Send SMS via Twilio, AWS SNS, etc.
    // - Store notification history in database
    
    // Example production code:
    // await this.emailService.send(notification);
    // await this.pushService.send(notification);
    // await this.notificationHistory.create(notification);
  }

  /**
   * Get service status and statistics
   */
  getStatus() {
    const jobs = Array.from(this.jobs.values());
    return {
      isRunning: this.isRunning,
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      sentJobs: jobs.filter(j => j.status === 'sent').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      nextReminder: jobs
        .filter(j => j.status === 'pending')
        .sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime())[0]?.reminderTime
    };
  }
}

// Singleton instance
export const reminderService = new MockReminderService();

// Disable auto-start to prevent continuous background processing
// if (process.env.NODE_ENV === 'development') {
//   reminderService.start();
// }

// Graceful shutdown
process.on('SIGTERM', () => {
  reminderService.stop();
});

process.on('SIGINT', () => {
  reminderService.stop();
});