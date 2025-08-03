import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { EventStatus } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationButton, NavigationLink } from '@/components/ui/navigation-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton, TableSkeleton, TimelineSkeleton } from '@/components/ui/loading';
import EventsTableWrapper from '@/components/events-table-wrapper';
import EventsFilterWrapper from '@/components/events-filter-wrapper';
import ReminderTimeline from '@/components/reminder-timeline';
import { getEvents } from '@/actions/event-actions';
import { EventTableFilters, PaginationParams } from '@/types';
import { Plus, Calendar, Clock } from 'lucide-react';

// DISABLED: Prevent continuous reloads by disabling automatic revalidation
// export const revalidate = 300; // Revalidate every 5 minutes - DISABLED to prevent continuous reloads
export const dynamic = 'force-dynamic'; // Force dynamic rendering to prevent revalidation issues

interface EventsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: EventStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    hasReminder?: string;
  }>;
}

let pageRenderCount = 0;

export default async function EventsPage({ searchParams }: EventsPageProps) {
  pageRenderCount++;
  console.log('[EVENTS_PAGE] EventsPage component rendering #', pageRenderCount, {
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 5)
  });
  
  const session = await auth();
  if (!session?.user) {
    console.log('[EVENTS_PAGE] No session, redirecting to login');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please log in to view your events.
              </p>
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  console.log('[EVENTS_PAGE] Resolved search params:', {
    resolvedSearchParams,
    renderCount: pageRenderCount,
    timestamp: new Date().toISOString()
  });
  
  // Parse search parameters
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = parseInt(resolvedSearchParams.pageSize || '10', 10);
  const sortBy = resolvedSearchParams.sortBy || 'date';
  const sortOrder = resolvedSearchParams.sortOrder || 'desc';
  
  const filters: EventTableFilters = {
    status: resolvedSearchParams.status,
    search: resolvedSearchParams.search,
    startDate: resolvedSearchParams.startDate ? new Date(resolvedSearchParams.startDate) : undefined,
    endDate: resolvedSearchParams.endDate ? new Date(resolvedSearchParams.endDate) : undefined,
    hasReminder: resolvedSearchParams.hasReminder === 'true' ? true : undefined,
  };

  const paginationParams: PaginationParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
  };

  // Fetch events with server-side pagination and filtering
  console.log('[EVENTS_PAGE] Calling getEvents with params:', {
    paginationParams,
    filters,
    renderCount: pageRenderCount,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  
  const startTime = Date.now();
  const eventsResponse = await getEvents(paginationParams, filters);
  const endTime = Date.now();
  
  console.log('[EVENTS_PAGE] getEvents response:', {
    eventsCount: eventsResponse.events.length,
    totalCount: eventsResponse.totalCount,
    executionTime: `${endTime - startTime}ms`,
    renderCount: pageRenderCount,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage your events and reminders
          </p>
        </div>
        <NavigationButton href="/events/new">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </NavigationButton>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      }>
        <div className="grid gap-4 md:grid-cols-3">
          <NavigationLink href="/events" className="block transition-transform hover:scale-105" showSpinner={false}>
            <Card className="cursor-pointer hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventsResponse.totalCount}</div>
                <p className="text-xs text-muted-foreground">
                  Across all statuses
                </p>
              </CardContent>
            </Card>
          </NavigationLink>
          <NavigationLink href="/events?hasReminder=true" className="block transition-transform hover:scale-105" showSpinner={false}>
            <Card className="cursor-pointer hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Reminders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {eventsResponse.events.filter(event => event.reminder).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Events with active reminders
                </p>
              </CardContent>
            </Card>
          </NavigationLink>
          <NavigationLink href="/events?status=PUBLISHED" className="block transition-transform hover:scale-105" showSpinner={false}>
            <Card className="cursor-pointer hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {eventsResponse.events.filter(event => event.status === 'PUBLISHED').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Live events
                </p>
              </CardContent>
            </Card>
          </NavigationLink>
        </div>
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Events Table and Filters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Bar */}
          <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}>
            <EventsFilterWrapper
              filters={filters}
            />
          </Suspense>

          {/* Events Table */}
          <Suspense fallback={<TableSkeleton rows={8} columns={5} />}>
            <EventsTableWrapper
              data={eventsResponse.events}
              totalCount={eventsResponse.totalCount}
              currentPage={page}
              pageSize={pageSize}
            />
          </Suspense>
        </div>

        {/* Sidebar - Reminder Timeline */}
        <div className="space-y-6">
          <Suspense fallback={<TimelineSkeleton />}>
            <ReminderTimeline 
              events={eventsResponse.events}
              className="sticky top-6"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}