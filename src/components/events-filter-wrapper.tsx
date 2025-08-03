'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import FilterBar from './filter-bar';
import { EventTableFilters } from '@/types';

let renderCount = 0;

interface EventsFilterWrapperProps {
  filters: EventTableFilters;
}

export default function EventsFilterWrapper({ filters }: EventsFilterWrapperProps) {
  renderCount++;
  console.log('[FILTER_WRAPPER] Component render #', renderCount, {
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  console.log('[FILTER_WRAPPER] Hooks initialized', {
    pathname,
    searchParamsString: searchParams.toString(),
    timestamp: new Date().toISOString()
  });

  const updateURL = useCallback((newFilters: EventTableFilters) => {
    console.log('[FILTER_WRAPPER] updateURL called', {
      newFilters,
      currentSearchParams: searchParams.toString(),
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search parameter
    if (newFilters.search) {
      params.set('search', newFilters.search);
    } else {
      params.delete('search');
    }
    
    // Update status parameter
    if (newFilters.status) {
      params.set('status', newFilters.status);
    } else {
      params.delete('status');
    }
    
    // Update date parameters
    if (newFilters.startDate) {
      params.set('startDate', newFilters.startDate.toISOString().split('T')[0]);
    } else {
      params.delete('startDate');
    }
    
    if (newFilters.endDate) {
      params.set('endDate', newFilters.endDate.toISOString().split('T')[0]);
    } else {
      params.delete('endDate');
    }
    
    // Update reminder parameter
    if (newFilters.hasReminder) {
      params.set('hasReminder', 'true');
    } else {
      params.delete('hasReminder');
    }
    
    // Reset to first page when filters change
    params.set('page', '1');
    
    const newUrl = `${pathname}?${params.toString()}`;
    console.log('[FILTER_WRAPPER] Navigating to new URL', {
      newUrl,
      timestamp: new Date().toISOString()
    });
    
    // Navigate to the new URL
    router.push(newUrl);
  }, [router, pathname, searchParams]);

  const handleFiltersChange = useCallback((newFilters: EventTableFilters) => {
    console.log('[FILTER_WRAPPER] handleFiltersChange called', {
      newFilters,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    updateURL(newFilters);
  }, [updateURL]);

  const handleClearFilters = useCallback(() => {
    console.log('[FILTER_WRAPPER] handleClearFilters called', {
      currentSearchParams: searchParams.toString(),
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Remove all filter parameters
    params.delete('search');
    params.delete('status');
    params.delete('startDate');
    params.delete('endDate');
    params.delete('hasReminder');
    
    // Reset to first page
    params.set('page', '1');
    
    const newUrl = `${pathname}?${params.toString()}`;
    console.log('[FILTER_WRAPPER] Clearing filters, navigating to', {
      newUrl,
      timestamp: new Date().toISOString()
    });
    
    // Navigate to the new URL
    router.push(newUrl);
  }, [router, pathname, searchParams]);

  return (
    <FilterBar
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onClearFilters={handleClearFilters}
    />
  );
}