'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Event, EventStatus } from '@prisma/client';
import { createEvent, updateEvent } from '@/actions/event-actions';
import { eventFormSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { EventFormInput } from '@/types';
import { format } from 'date-fns';

interface EventFormProps {
  event?: Event;
  mode: 'create' | 'edit';
  onSuccess?: (event: Event) => void;
  onCancel?: () => void;
}

export default function EventForm({ event, mode, onSuccess, onCancel }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || `Tech Conference ${Math.floor(Math.random() * 1000) + 1}`,
      description: event?.description || 'Join us for an exciting technology conference featuring the latest innovations and networking opportunities. This event will showcase cutting-edge developments in the tech industry.',
      date: event?.date || new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      location: event?.location || 'US-CA: San Francisco',
      status: event?.status || EventStatus.DRAFT,
    },
  });

  const onSubmit = async (data: EventFormInput) => {
    setIsLoading(true);

    try {
      let result;
      
      if (mode === 'create') {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('date', data.date.toISOString());
        formData.append('location', data.location);
        formData.append('status', data.status);
        
        result = await createEvent(formData);
      } else {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description || '');
        formData.append('date', data.date.toISOString());
        formData.append('location', data.location);
        formData.append('status', data.status);
        
        result = await updateEvent(event!.id, formData);
      }

      if (result.error) {
        toast.error(result.error);
        
        // Handle specific validation errors
        if (result.error.includes('title and date already exists')) {
          form.setError('title', {
            type: 'manual',
            message: result.error,
          });
        }
      } else if (result.success) {
        const successMessage = mode === 'create' ? 'Event created successfully' : 'Event updated successfully';
        toast.success(successMessage);
        
        if (onSuccess && result.event) {
          onSuccess(result.event);
        } else {
          console.log('[EVENT_FORM] Navigating to event page and refreshing router at:', new Date().toISOString());
          router.push(`/events/${result.event?.id || event?.id}`);
          router.refresh();
        }
      }
    } catch (error) {
      console.error(`Event ${mode} error:`, error);
      const errorMessage = `An unexpected error occurred while ${mode === 'create' ? 'creating' : 'updating'} the event. Please try again.`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === 'create' ? 'Create New Event' : 'Edit Event'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Fill in the details to create a new event'
            : 'Update your event details'
          }
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter event title (max 100 characters)"
                      maxLength={100}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your event (max 500 characters)"
                      maxLength={500}
                      rows={4}
                      disabled={isLoading}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date and Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isLoading}
                        value={formatDateForInput(field.value)}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., US-NY: New York"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={EventStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={EventStatus.PUBLISHED}>Published</SelectItem>
                      <SelectItem value={EventStatus.CANCELED}>Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                : (mode === 'create' ? 'Create Event' : 'Update Event')
              }
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}