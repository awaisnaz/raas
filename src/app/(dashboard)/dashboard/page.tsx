import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventStatus } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationButton, NavigationLink } from '@/components/ui/navigation-link';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Get counts for different event statuses
  const eventCounts = await prisma.event.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  // Get upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      userId,
      date: { gte: new Date() },
      status: { not: EventStatus.CANCELED },
    },
    orderBy: { date: 'asc' },
    take: 5,
    include: {
      reminders: {
        where: { userId },
      },
    },
  });

  // Transform data for display
  const statusCounts = {
    [EventStatus.DRAFT]: 0,
    [EventStatus.PUBLISHED]: 0,
    [EventStatus.CANCELED]: 0,
  };

  eventCounts.forEach((count) => {
    statusCounts[count.status as EventStatus] = count._count;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <NavigationButton href="/events/new">
          Create Event
        </NavigationButton>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <NavigationLink href="/events" className="block transition-transform hover:scale-105">
          <Card className="cursor-pointer hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <CardDescription>All your events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(statusCounts).reduce((a, b) => a + b, 0)}
              </div>
            </CardContent>
          </Card>
        </NavigationLink>
        <NavigationLink href="/events?status=PUBLISHED" className="block transition-transform hover:scale-105">
          <Card className="cursor-pointer hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published Events</CardTitle>
              <CardDescription>Events visible to others</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statusCounts[EventStatus.PUBLISHED]}
              </div>
            </CardContent>
          </Card>
        </NavigationLink>
        <NavigationLink href="/events?status=DRAFT" className="block transition-transform hover:scale-105">
          <Card className="cursor-pointer hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Draft Events</CardTitle>
              <CardDescription>Events in preparation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statusCounts[EventStatus.DRAFT]}
              </div>
            </CardContent>
          </Card>
        </NavigationLink>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    {new Date(event.date).toLocaleDateString()} at{' '}
                    {new Date(event.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Location:</span> {event.location}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Status:</span> {event.status}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Reminder:</span>{' '}
                      {event.reminders.length > 0 ? (
                        <span className="text-green-600">
                          Set for{' '}
                          {new Date(event.reminders[0].reminderTime).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium">No upcoming events</h3>
            <p className="text-muted-foreground mt-2">
              Create your first event to get started.
            </p>
            <NavigationButton className="mt-4" href="/events/new">
              Create Event
            </NavigationButton>
          </div>
        )}
      </div>
    </div>
  );
}