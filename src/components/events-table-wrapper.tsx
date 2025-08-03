'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import EventTable from './event-table';
import { EventWithReminder } from '@/types';

let tableRenderCount = 0;

interface EventsTableWrapperProps {
  data: EventWithReminder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export default function EventsTableWrapper({
  data,
  totalCount,
  currentPage,
  pageSize,
}: EventsTableWrapperProps) {
  tableRenderCount++;
  console.log('[TABLE_WRAPPER] Component render #', tableRenderCount, {
    eventsCount: data.length,
    currentPage,
    totalCount,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  console.log('[TABLE_WRAPPER] Hooks initialized', {
    pathname,
    searchParamsString: searchParams.toString(),
    eventsCount: data.length,
    timestamp: new Date().toISOString()
  });

  // Prevent scroll restoration on page load
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    console.log('[TABLE_WRAPPER] handlePageChange called', {
      newPage: page,
      currentPage,
      currentSearchParams: searchParams.toString(),
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    
    // Store current scroll position
    const scrollY = window.scrollY;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    const newUrl = `${pathname}?${params.toString()}`;
    
    console.log('[TABLE_WRAPPER] Navigating to page', {
      newUrl,
      timestamp: new Date().toISOString()
    });
    
    // Use router.push with scroll disabled
    router.push(newUrl, { scroll: false });
    
    // Restore scroll position after navigation
    setTimeout(() => {
      console.log('[TABLE_WRAPPER] Restoring scroll position');
      window.scrollTo(0, scrollY);
    }, 0);
  }, [router, pathname, searchParams, currentPage]);

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    console.log('[TABLE_WRAPPER] handleSortChange called', {
      sortBy,
      sortOrder,
      currentSearchParams: searchParams.toString(),
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 3)
    });
    
    // Store current scroll position
    const scrollY = window.scrollY;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', '1'); // Reset to first page when sorting changes
    
    const newUrl = `${pathname}?${params.toString()}`;
    console.log('[TABLE_WRAPPER] Navigating with new sort', {
      newUrl,
      timestamp: new Date().toISOString()
    });
    
    // Use router.push with scroll disabled
    router.push(newUrl, { scroll: false });
    
    // Restore scroll position after navigation
    setTimeout(() => {
      console.log('[TABLE_WRAPPER] Restoring scroll position after sort');
      window.scrollTo(0, scrollY);
    }, 0);
  }, [router, pathname, searchParams]);

  return (
    <EventTable
      data={data}
      totalCount={totalCount}
      currentPage={currentPage}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onSortChange={handleSortChange}
    />
  );
}