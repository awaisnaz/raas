import Link from 'next/link';
import { auth } from '@/lib/auth';
import { MainNav } from '@/components/main-nav';
import { UserAccountNav } from '@/components/user-account-nav';
import { Button } from '@/components/ui/button';
import { NavigationButton } from '@/components/ui/navigation-link';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <span className="font-bold text-lg">Event Dashboard</span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-4">
          <div className="flex-1 md:flex-none">
            {session?.user && <MainNav />}
          </div>
          <nav className="flex items-center ml-auto">
            {session?.user ? (
              <UserAccountNav user={session.user} />
            ) : (
              <div className="flex items-center gap-3">
                <NavigationButton variant="ghost" size="sm" href="/login">
                  Login
                </NavigationButton>
                <NavigationButton size="sm" href="/register">
                  Register
                </NavigationButton>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}