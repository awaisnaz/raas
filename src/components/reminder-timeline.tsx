'use client';

import { useState, useEffect } from 'react';
import { EventWithReminder } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Calendar, MapPin, Bell, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format, isPast, isFuture } from 'date-fns';

interface ReminderTimelineProps {
  events: EventWithReminder[];
  className?: string;
}

export default function ReminderTimeline({ events, className }: ReminderTimelineProps) {
  // Use state for current time to control re-renders
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());

  // Debug logging for component re-renders
  console.log('[REMINDER_TIMELINE] Component rendered at:', new Date().toISOString(), {
    eventsCount: events.length,
    isVisible,
    timeSinceLastActivity: Date.now() - lastUserActivity
  });

  // Track user activity to pause updates when user is inactive
  useEffect(() => {
    console.log('[REMINDER_TIMELINE] Setting up user activity listeners');
    const handleUserActivity = () => {
      console.log('[REMINDER_TIMELINE] User activity detected');
      setLastUserActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      console.log('[REMINDER_TIMELINE] Cleaning up user activity listeners');
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  // DISABLED: Update current time every 5 minutes to prevent continuous re-renders
  // The time updates are not critical for functionality and were causing page reloads
  // useEffect(() => {
  //   console.log('[REMINDER_TIMELINE] Setting up time update interval');
  //   const interval = setInterval(() => {
  //     const timeSinceLastActivity = Date.now() - lastUserActivity;
  //     console.log('[REMINDER_TIMELINE] Time update interval triggered', {
  //       timeSinceLastActivity,
  //       isVisible,
  //       shouldUpdate: timeSinceLastActivity < 10 * 60 * 1000 && isVisible
  //     });
  //     // Only update if user was active in the last 10 minutes and component is visible
  //     if (timeSinceLastActivity < 10 * 60 * 1000 && isVisible) {
  //       console.log('[REMINDER_TIMELINE] Updating current time');
  //       setCurrentTime(new Date());
  //     }
  //   }, 5 * 60 * 1000); // Update every 5 minutes instead of 1 minute

  //   return () => {
  //     console.log('[REMINDER_TIMELINE] Cleaning up time update interval');
  //     clearInterval(interval);
  //   };
  // }, [lastUserActivity, isVisible]);
  
  console.log('[REMINDER_TIMELINE] Time update interval DISABLED to prevent continuous re-renders');

  // Use Intersection Observer to pause updates when component is not visible
  useEffect(() => {
    console.log('[REMINDER_TIMELINE] Setting up intersection observer');
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log('[REMINDER_TIMELINE] Intersection observer triggered', {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio
        });
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('reminder-timeline');
    if (element) {
      console.log('[REMINDER_TIMELINE] Starting to observe element');
      observer.observe(element);
    }

    return () => {
      console.log('[REMINDER_TIMELINE] Cleaning up intersection observer');
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  // Filter events that have reminders and sort by reminder time
  const eventsWithReminders = events
    .filter(event => event.reminder)
    .sort((a, b) => {
      if (!a.reminder || !b.reminder) return 0;
      return new Date(a.reminder.reminderTime).getTime() - new Date(b.reminder.reminderTime).getTime();
    });

  if (eventsWithReminders.length === 0) {
    return (
      <Card id="reminder-timeline" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reminders set</p>
            <p className="text-sm">Create events with reminders to see them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (reminderTime: Date, eventDate: Date) => {
    if (isPast(eventDate)) {
      return 'bg-gray-500'; // Past event
    }
    
    if (isPast(reminderTime)) {
      return 'bg-red-500'; // Reminder time passed but event is future
    }
    
    const hoursUntilReminder = (reminderTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilReminder <= 1) {
      return 'bg-red-500'; // Very urgent
    } else if (hoursUntilReminder <= 24) {
      return 'bg-orange-500'; // Urgent
    } else if (hoursUntilReminder <= 72) {
      return 'bg-yellow-500'; // Soon
    } else {
      return 'bg-green-500'; // Future
    }
  };

  const getTimeUntilReminder = (reminderTime: Date) => {
    if (isPast(reminderTime)) {
      return `${formatDistanceToNow(reminderTime)} ago`;
    }
    return `in ${formatDistanceToNow(reminderTime)}`;
  };

  const getEventTimeFromReminder = (reminderTime: Date, eventDate: Date) => {
    const diffMs = eventDate.getTime() - reminderTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m before`;
    }
    return `${diffMinutes}m before`;
  };

  return (
    <TooltipProvider>
      <Card id="reminder-timeline" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Timeline
            <Badge variant="secondary" className="ml-auto">
              {eventsWithReminders.length} reminder{eventsWithReminders.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {eventsWithReminders.map((event, index) => {
                if (!event.reminder) return null;
                
                const reminderTime = new Date(event.reminder.reminderTime);
                const eventDate = new Date(event.date);
                const statusColor = getStatusColor(reminderTime, eventDate);
                const isPastReminder = isPast(reminderTime);
                const isPastEvent = isPast(eventDate);
                
                return (
                  <div key={event.id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background ${statusColor}`}>
                      {isPastEvent ? (
                        <Clock className="h-5 w-5 text-white" />
                      ) : isPastReminder ? (
                        <AlertCircle className="h-5 w-5 text-white" />
                      ) : (
                        <Bell className="h-5 w-5 text-white" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="font-semibold text-foreground truncate cursor-help">
                                {event.title}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(eventDate, 'MMM d, yyyy HH:mm')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <Badge 
                              variant={event.status === 'PUBLISHED' ? 'default' : 
                                      event.status === 'DRAFT' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {event.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getEventTimeFromReminder(reminderTime, eventDate)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium">
                            {isPastReminder ? (
                              <span className="text-red-600">Reminder passed</span>
                            ) : (
                              <span className="text-foreground">
                                Reminder {getTimeUntilReminder(reminderTime)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(reminderTime, 'MMM d, HH:mm')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress indicator for upcoming reminders */}
                      {!isPastEvent && !isPastReminder && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Reminder</span>
                            <span>Event</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${statusColor}`}
                              style={{
                                width: `${Math.min(100, Math.max(0, 
                                  ((currentTime.getTime() - reminderTime.getTime()) / 
                                   (eventDate.getTime() - reminderTime.getTime())) * 100
                                ))}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}