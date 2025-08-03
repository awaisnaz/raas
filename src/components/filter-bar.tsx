'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventStatus } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventTableFilters } from '@/types';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  filters: EventTableFilters;
  onFiltersChange?: (filters: EventTableFilters) => void;
  onClearFilters?: () => void;
}

let filterBarRenderCount = 0;

export default function FilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
}: FilterBarProps) {
  filterBarRenderCount++;
  console.log('[FILTER_BAR] Component render #', filterBarRenderCount, {
    filters,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [startDate, setStartDate] = useState(
    filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''
  );

  // Debounced search with 500ms delay as required
  const debouncedSearch = useCallback(
    debounce((value: string, currentFilters: EventTableFilters) => {
      onFiltersChange?.({ ...currentFilters, search: value || undefined });
    }, 500),
    [onFiltersChange]
  );

  useEffect(() => {
    // Only trigger search if the search value actually changed from the filters
    if (searchValue !== (filters.search || '')) {
      debouncedSearch(searchValue, filters);
    }
  }, [searchValue, debouncedSearch, filters.search]);

  const handleStatusChange = (status: string) => {
    onFiltersChange?.({
      ...filters,
      status: status === 'all' ? undefined : (status as EventStatus),
    });
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    onFiltersChange?.({
      ...filters,
      startDate: date ? new Date(date) : undefined,
    });
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    onFiltersChange?.({
      ...filters,
      endDate: date ? new Date(date) : undefined,
    });
  };

  const handleReminderFilterChange = (checked: boolean) => {
    onFiltersChange?.({
      ...filters,
      hasReminder: checked ? true : undefined,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status ||
    filters.startDate ||
    filters.endDate ||
    filters.hasReminder;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchValue('');
                setStartDate('');
                setEndDate('');
                onClearFilters?.();
              }}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or location..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Search is case-insensitive and supports partial matches
          </p>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={EventStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={EventStatus.PUBLISHED}>Published</SelectItem>
              <SelectItem value={EventStatus.CANCELED}>Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* Reminder Filter */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasReminder"
            checked={filters.hasReminder || false}
            onCheckedChange={handleReminderFilterChange}
          />
          <Label
            htmlFor="hasReminder"
            className="text-sm font-normal cursor-pointer"
          >
            Show only events with reminders
          </Label>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Active filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                  Search: &quot;{filters.search}&quot;
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
                  Status: {filters.status}
                </span>
              )}
              {filters.startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                  From: {filters.startDate.toLocaleDateString()}
                </span>
              )}
              {filters.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs">
                  To: {filters.endDate.toLocaleDateString()}
                </span>
              )}
              {filters.hasReminder && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs">
                  Has Reminder
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Debounce utility function
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}