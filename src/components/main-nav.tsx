'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NavigationLink } from '@/components/ui/navigation-link';

let mainNavRenderCount = 0;

export function MainNav() {
  mainNavRenderCount++;
  const pathname = usePathname();
  
  console.log('[MAIN_NAV] Component render #', mainNavRenderCount, {
    pathname,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
    },
    {
      name: 'Events',
      href: '/events',
    },
  ];

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8">
      {navItems.map((item) => (
        <NavigationLink
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md',
            pathname === item.href
              ? 'text-foreground bg-accent'
              : 'text-muted-foreground hover:bg-accent/50'
          )}
        >
          {item.name}
        </NavigationLink>
      ))}
    </nav>
  );
}