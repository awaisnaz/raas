'use client';

import { signOut } from '@/actions/auth-actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from 'next-auth';
import Link from 'next/link';
import { NavigationLink } from '@/components/ui/navigation-link';

interface UserAccountNavProps {
  user: User;
}

let userAccountNavRenderCount = 0;

export function UserAccountNav({ user }: UserAccountNavProps) {
  userAccountNavRenderCount++;
  console.log('[USER_ACCOUNT_NAV] Component render #', userAccountNavRenderCount, {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent">
          <span className="sr-only">Open user menu</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-lg ring-2 ring-white/20 hover:shadow-xl transition-all duration-200 hover:scale-105">
            {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-3 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-xs shadow-md">
            {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavigationLink href="/dashboard" showSpinner={false}>Dashboard</NavigationLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <NavigationLink href="/events" showSpinner={false}>Events</NavigationLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault();
            signOut();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}