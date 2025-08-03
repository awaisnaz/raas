import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EventActions from '@/components/event-actions';
import ReminderForm from '@/components/reminder-form';

// DISABLED: Prevent continuous reloads by disabling automatic revalidation
// export const revalidate = 300; // Revalidate every 5 minutes - DISABLED to prevent continuous reloads
export const dynamic = 'force-dynamic'; // Force dynamic rendering to prevent revalidation issues

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return notFound();
  }

  const event = await prisma.event.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      reminders: {
        where: { userId },
      },
    },
  });

  if (!event) {
    return notFound();
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString();
  const formattedTime = eventDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-2">
            <Badge
              variant={event.status === EventStatus.PUBLISHED ? 'default' : 
                      event.status === EventStatus.CANCELED ? 'destructive' : 
                      'outline'}
            >
              {event.status}
            </Badge>
            <span className="text-muted-foreground">
              {formattedDate} at {formattedTime}
            </span>
          </div>
        </div>
        <EventActions event={event} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground mt-1">
                {event.description || 'No description provided'}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Location</h3>
              <p className="text-muted-foreground mt-1">{event.location}</p>
            </div>
            <div>
              <h3 className="font-medium">Date and Time</h3>
              <p className="text-muted-foreground mt-1">
                {formattedDate} at {formattedTime}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/events">Back to Events</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>
                Set reminders for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.reminders.length > 0 ? (
                <div className="space-y-4">
                  {event.reminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(reminder.reminderTime).toLocaleDateString()}{' '}
                          {new Date(reminder.reminderTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reminder.reminderTime) > new Date()
                            ? 'Upcoming'
                            : 'Past'}
                        </p>
                      </div>
                      <form action={async () => {
                        'use server';
                        const { deleteReminder } = await import('@/actions/reminder-actions');
                        await deleteReminder(reminder.id);
                      }}>
                        <Button variant="destructive" size="sm" type="submit">
                          Delete
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No reminders set for this event.
                </p>
              )}
            </CardContent>
          </Card>

          <ReminderForm 
            eventId={event.id}
            eventDate={event.date}
            eventTitle={event.title}
            existingReminder={event.reminders.length > 0 ? {
              id: event.reminders[0].id,
              reminderTime: event.reminders[0].reminderTime
            } : undefined}
          />
        </div>
      </div>
    </div>
  );
}