'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Spinner } from './loading';

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showSpinner?: boolean;
  onClick?: () => void;
}

export function NavigationLink({ 
  href, 
  children, 
  className, 
  showSpinner = true,
  onClick 
}: NavigationLinkProps) {
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
    
    // Only handle client-side navigation for internal links
    if (href.startsWith('/')) {
      e.preventDefault();
      setIsNavigating(true);
      
      startTransition(() => {
        router.push(href);
        // Reset loading state after a short delay to ensure smooth transition
        setTimeout(() => setIsNavigating(false), 100);
      });
    }
  };

  const isLoading = isPending || isNavigating;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-opacity',
        isLoading && 'opacity-70 pointer-events-none',
        className
      )}
    >
      {isLoading && showSpinner && <Spinner size="sm" />}
      {children}
    </Link>
  );
}

// Button variant for navigation
interface NavigationButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showSpinner?: boolean;
  onClick?: () => void;
}

export function NavigationButton({ 
  href, 
  children, 
  variant = 'default',
  size = 'default',
  className,
  showSpinner = true,
  onClick 
}: NavigationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    
    setIsNavigating(true);
    
    startTransition(() => {
      router.push(href);
      // Reset loading state after a short delay
      setTimeout(() => setIsNavigating(false), 100);
    });
  };

  const isLoading = isPending || isNavigating;

  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3',
    default: 'h-10 px-4 py-2',
    lg: 'h-11 px-8'
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {isLoading && showSpinner && <Spinner size="sm" />}
      {children}
    </button>
  );
}