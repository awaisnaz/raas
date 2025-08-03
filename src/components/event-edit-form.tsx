'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, EventStatus } from '@prisma/client';
import { updateEvent } from '@/actions/event-actions';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface EventEditFormProps {
  event: Event;
}

export default function EventEditForm({ event }: EventEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EventStatus>(event.status);

  // Format date for datetime-local input
  const formattedDate = new Date(event.date).toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set('status', status);
      
      const result = await updateEvent(event.id, formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.success) {
        toast.success('Event updated successfully');
        router.push(`/events/${event.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Event update error:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Edit Event</CardTitle>
        <CardDescription>
          Update your event details
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={event.title}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={event.description || ''}
              rows={4}
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date and Time</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={formattedDate}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={event.location}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              defaultValue={event.status} 
              onValueChange={(value) => setStatus(value as EventStatus)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EventStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={EventStatus.PUBLISHED}>Published</SelectItem>
                <SelectItem value={EventStatus.CANCELED}>Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <LoadingButton type="submit" loading={isLoading}>
            Update Event
          </LoadingButton>
        </CardFooter>
      </form>
    </Card>
  );
}