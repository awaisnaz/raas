import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to dashboard if already authenticated
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex bg-muted items-center justify-center p-8">
        <div className="max-w-md">
          <Link href="/" className="flex items-center space-x-2 mb-8">
            <span className="font-bold text-2xl">Event Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold mb-4">Welcome to Event Management Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your events and reminders in one place. Create, edit, and track events with ease.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}