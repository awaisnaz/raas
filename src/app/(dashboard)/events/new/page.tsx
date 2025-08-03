'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEvent } from '@/actions/event-actions';
import { eventFormSchema } from '@/lib/validations';
import { EventStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { format } from 'date-fns';

type EventFormData = {
  title: string;
  description?: string;
  date: Date;
  location: string;
  status: EventStatus;
};

// Helper function to format date for datetime-local input
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: `Tech Conference ${Math.floor(Math.random() * 1000) + 1}`,
      description: `Join us for an exciting technology conference featuring the latest innovations and networking opportunities. This event will showcase cutting-edge developments in the tech industry.`,
      date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within next 30 days
      location: `US-CA: San Francisco`,
      status: EventStatus.DRAFT,
    },
  });

  async function onSubmit(data: EventFormData) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('date', data.date.toISOString());
      formData.append('location', data.location);
      formData.append('status', data.status);
      
      const result = await createEvent(formData);

      if (result.error) {
        toast.error(result.error);
        // Set form errors for specific fields if the error message contains field info
        if (result.error.includes('Title:')) {
          form.setError('title', { message: result.error.replace('Title: ', '') });
        } else if (result.error.includes('Description:')) {
          form.setError('description', { message: result.error.replace('Description: ', '') });
        } else if (result.error.includes('Date:')) {
          form.setError('date', { message: result.error.replace('Date: ', '') });
        } else if (result.error.includes('Location:')) {
          form.setError('location', { message: result.error.replace('Location: ', '') });
        } else if (result.error.includes('Status:')) {
          form.setError('status', { message: result.error.replace('Status: ', '') });
        } else {
          form.setError('root', { message: result.error });
        }
      } else if (result.success) {
        toast.success('Event created successfully');
        router.push(`/events/${result.event.id}`);
        router.refresh();
      }
    } catch (error) {
      console.error('Event creation error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
      form.setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Event</CardTitle>
          <CardDescription>
            Fill in the details to create a new event
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
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter event title"
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
                        placeholder="Describe your event"
                        rows={4}
                        disabled={isLoading}
                        {...field}
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
                      <FormLabel>Date and Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isLoading}
                          value={formatDateForInput(field.value)}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Date must be in the future
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Format: US-NY: New York"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Location must include country code prefix (e.g., &quot;US-NY: New York&quot;)
                      </p>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EventStatus.DRAFT}>Draft</SelectItem>
                        <SelectItem value={EventStatus.PUBLISHED}>Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.formState.errors.root && (
                <div className="text-sm text-red-500">
                  {form.formState.errors.root.message}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}