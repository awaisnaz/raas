'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { reminderFormSchema } from '@/lib/validations';
import { ReminderFormInput } from '@/types';
import { createReminder, updateReminder, deleteReminder } from '@/actions/reminder-actions';
import { Bell, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { format, addMinutes, addHours, addDays } from 'date-fns';

interface ReminderFormProps {
  eventId: string;
  eventDate: Date;
  eventTitle: string;
  existingReminder?: {
    id: string;
    reminderTime: Date;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const REMINDER_PRESETS = [
  { label: '15 minutes before', value: '15m', unit: 'minutes', amount: 15 },
  { label: '30 minutes before', value: '30m', unit: 'minutes', amount: 30 },
  { label: '1 hour before', value: '1h', unit: 'hours', amount: 1 },
  { label: '2 hours before', value: '2h', unit: 'hours', amount: 2 },
  { label: '1 day before', value: '1d', unit: 'days', amount: 1 },
  { label: '2 days before', value: '2d', unit: 'days', amount: 2 },
  { label: '1 week before', value: '7d', unit: 'days', amount: 7 },
  { label: 'Custom', value: 'custom', unit: 'custom', amount: 0 },
];

let reminderFormRenderCount = 0;

export default function ReminderForm({
  eventId,
  eventDate,
  eventTitle,
  existingReminder,
  onSuccess,
  onCancel,
}: ReminderFormProps) {
  reminderFormRenderCount++;
  console.log('[REMINDER_FORM] Component render #', reminderFormRenderCount, {
    eventId,
    eventTitle,
    hasExistingReminder: !!existingReminder,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(
    existingReminder ? 'custom' : '1h' // Default to 1 hour
  );

  // Optimistic state for immediate UI updates
  const [optimisticReminder, setOptimisticReminder] = useOptimistic(
    existingReminder,
    (state, newReminder: { id: string; reminderTime: Date } | null) => newReminder || undefined
  );

  const form = useForm<ReminderFormInput>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      eventId,
      reminderTime: existingReminder
        ? existingReminder.reminderTime
        : addHours(eventDate, -1), // Default to 1 hour before
    },
  });

  const calculateReminderTime = (preset: string) => {
    const presetConfig = REMINDER_PRESETS.find(p => p.value.toString() === preset);
    if (!presetConfig || presetConfig.unit === 'custom') return null;

    const eventDateTime = new Date(eventDate);
    
    switch (presetConfig.unit) {
      case 'minutes':
        return addMinutes(eventDateTime, -presetConfig.amount);
      case 'hours':
        return addHours(eventDateTime, -presetConfig.amount);
      case 'days':
        return addDays(eventDateTime, -presetConfig.amount);
      default:
        return null;
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      const calculatedTime = calculateReminderTime(preset);
      if (calculatedTime) {
        form.setValue('reminderTime', calculatedTime);
      }
    }
  };

  const onSubmit = async (data: ReminderFormInput) => {
    setIsLoading(true);
    
    // Optimistic update - immediately show the new reminder state
    const optimisticReminderData = {
      id: existingReminder?.id || 'temp-id',
      reminderTime: data.reminderTime
    };
    startTransition(() => {
      setOptimisticReminder(optimisticReminderData);
    });
    
    try {
      let result;
      
      if (existingReminder) {
        result = await updateReminder(existingReminder.id, data);
      } else {
        result = await createReminder(data);
      }
      
      if (result.success) {
        toast.success(
          existingReminder 
            ? 'Reminder updated successfully' 
            : 'Reminder created successfully'
        );
        
        // Log notification as required
        const reminderTime = new Date(data.reminderTime);
        const timeUntilEvent = Math.floor(
          (eventDate.getTime() - reminderTime.getTime()) / (1000 * 60)
        );
        const relativeTime = timeUntilEvent >= 60 
          ? `${Math.floor(timeUntilEvent / 60)}h ${timeUntilEvent % 60}m before`
          : `${timeUntilEvent}m before`;
        
        console.log(
          `[REMINDER] Event: ${eventTitle}, User: ${result.data?.userId}, Time: ${relativeTime}`
        );
        
        onSuccess?.();
      } else {
        // Revert optimistic update on failure
        startTransition(() => {
          setOptimisticReminder(existingReminder || null);
        });
        toast.error(result.error || 'Failed to save reminder');
      }
    } catch (error) {
      // Revert optimistic update on error
      startTransition(() => {
        setOptimisticReminder(existingReminder || null);
      });
      console.error('Error saving reminder:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReminder) return;
    
    setIsDeleting(true);
    
    // Optimistic update - immediately remove the reminder from UI
    startTransition(() => {
      setOptimisticReminder(null);
    });
    
    try {
      const result = await deleteReminder(existingReminder.id);
      
      if (result.success) {
        toast.success('Reminder deleted successfully');
        onSuccess?.();
      } else {
        // Revert optimistic update on failure
        startTransition(() => {
          setOptimisticReminder(existingReminder);
        });
        toast.error(result.error || 'Failed to delete reminder');
      }
    } catch (error) {
      // Revert optimistic update on error
      startTransition(() => {
        setOptimisticReminder(existingReminder);
      });
      console.error('Error deleting reminder:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const reminderTime = form.watch('reminderTime');
  const timeUntilEvent = reminderTime 
    ? Math.floor((eventDate.getTime() - new Date(reminderTime).getTime()) / (1000 * 60))
    : 0;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {existingReminder ? 'Edit Reminder' : 'Create Reminder'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Info */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Event Details</h4>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Title:</strong> {eventTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date:</strong> {format(eventDate, 'PPP p')}
                </p>
              </div>

              {/* Preset Selection */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_PRESETS.map((preset) => (
                      <SelectItem 
                        key={preset.value} 
                        value={preset.value.toString()}
                      >
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Time Input */}
              <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Reminder Time
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reminder must be between 15 minutes and 7 days before the event</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            field.onChange(new Date(e.target.value));
                            setSelectedPreset('custom');
                          }
                        }}
                        disabled={selectedPreset !== 'custom'}
                      />
                    </FormControl>
                    <FormDescription>
                      {timeUntilEvent > 0 && (
                        <span className="text-green-600">
                          Reminder will be {timeUntilEvent >= 60 
                            ? `${Math.floor(timeUntilEvent / 60)}h ${timeUntilEvent % 60}m`
                            : `${timeUntilEvent}m`
                          } before the event
                        </span>
                      )}
                      {timeUntilEvent <= 0 && (
                        <span className="text-red-600">
                          Reminder time must be before the event
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || timeUntilEvent <= 0}
                  className="flex-1"
                >
                  {isLoading ? 'Saving...' : existingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Button>
                
                {existingReminder && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4"
                  >
                    {isDeleting ? (
                      'Deleting...'
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
                
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading || isDeleting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}