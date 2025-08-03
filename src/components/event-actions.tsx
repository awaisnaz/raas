'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventStatus } from '@prisma/client';
import { deleteEvent, updateEvent } from '@/actions/event-actions';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';
import { NavigationButton } from '@/components/ui/navigation-link';

interface EventActionsProps {
  event: Event;
}

let eventActionsRenderCount = 0;

export default function EventActions({ event }: EventActionsProps) {
  eventActionsRenderCount++;
  console.log('[EVENT_ACTIONS] Component render #', eventActionsRenderCount, {
    eventId: event.id,
    eventTitle: event.title,
    eventStatus: event.status,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleStatusChange(status: EventStatus) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', event.title);
      formData.append('description', event.description || '');
      formData.append('date', event.date.toISOString());
      formData.append('location', event.location || '');
      formData.append('status', status);
      
      const result = await updateEvent(event.id, formData);
      if (result.success) {
        toast.success(`Event ${status.toLowerCase()}`);
        console.log('[EVENT_ACTIONS] Status updated, refreshing router at:', new Date().toISOString());
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setIsLoading(true);
    try {
      const result = await deleteEvent(event.id);
      if (result.success) {
        toast.success('Event deleted');
        router.push('/events');
        console.log('[EVENT_ACTIONS] Event deleted, refreshing router at:', new Date().toISOString());
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <NavigationButton variant="outline" href={`/events/${event.id}/edit`}>
        Edit
      </NavigationButton>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isLoading}>
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {event.status === EventStatus.DRAFT && (
            <DropdownMenuItem
              onClick={() => handleStatusChange(EventStatus.PUBLISHED)}
              disabled={isLoading}
            >
              Publish
            </DropdownMenuItem>
          )}
          
          {event.status === EventStatus.PUBLISHED && (
            <DropdownMenuItem
              onClick={() => handleStatusChange(EventStatus.DRAFT)}
              disabled={isLoading}
            >
              Unpublish
            </DropdownMenuItem>
          )}
          
          {event.status !== EventStatus.CANCELED && (
            <DropdownMenuItem
              onClick={() => handleStatusChange(EventStatus.CANCELED)}
              disabled={isLoading}
              className="text-red-600"
            >
              Cancel
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}