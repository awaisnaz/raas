import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavigationButton } from '@/components/ui/navigation-link';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            Reminder as a Service
          </h1>
          <p className="text-xl text-muted-foreground">
            A simple way to manage your events and reminders
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-lg">
            Create, manage, and get reminded of your important events. Never miss a deadline again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {isAuthenticated ? (
              <>
                <NavigationButton size="lg" href="/dashboard">
                  Go to Dashboard
                </NavigationButton>
                <NavigationButton size="lg" variant="outline" href="/events">
                  View Events
                </NavigationButton>
              </>
            ) : (
              <>
                <NavigationButton size="lg" href="/login">
                  Login
                </NavigationButton>
                <NavigationButton size="lg" variant="outline" href="/register">
                  Register
                </NavigationButton>
              </>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-border mt-12">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Event Management</h3>
              <p className="text-muted-foreground">
                Create and manage events with detailed information
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Reminders</h3>
              <p className="text-muted-foreground">
                Set reminders for your events to never miss them
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">User Dashboard</h3>
              <p className="text-muted-foreground">
                View all your events and reminders in one place
              </p>
            </div>
          </div>
        </div>
      </div>
     </div>
  );
}
