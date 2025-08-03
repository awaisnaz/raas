'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { EventStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EventWithReminder } from '@/types';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface EventTableProps {
  data: EventWithReminder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<EventWithReminder>();

let eventTableRenderCount = 0;

export default function EventTable({
  data,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSortChange,
  isLoading = false,
}: EventTableProps) {
  eventTableRenderCount++;
  console.log('[EVENT_TABLE] Component render #', eventTableRenderCount, {
    dataCount: data.length,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack?.split('\n').slice(1, 3)
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <Link
            href={`/events/${info.row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {info.getValue()}
          </Link>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('date', {
        header: 'Date & Time',
        cell: (info) => (
          <div className="text-sm">
            <div>{format(new Date(info.getValue()), 'MMM dd, yyyy')}</div>
            <div className="text-muted-foreground">
              {format(new Date(info.getValue()), 'h:mm a')}
            </div>
          </div>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('location', {
        header: 'Location',
        cell: (info) => (
          <div className="max-w-[200px] truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const variant = {
            [EventStatus.DRAFT]: 'secondary' as const,
            [EventStatus.PUBLISHED]: 'default' as const,
            [EventStatus.CANCELED]: 'destructive' as const,
          }[status];
          return <Badge variant={variant}>{status}</Badge>;
        },
        enableSorting: true,
      }),
      columnHelper.accessor('reminder', {
        header: 'Reminder',
        cell: (info) => {
          const reminder = info.getValue();
          if (!reminder) {
            return <span className="text-muted-foreground text-sm">None</span>;
          }
          const eventDate = new Date(info.row.original.date);
          const reminderDate = new Date(reminder.reminderTime);
          const timeDiff = eventDate.getTime() - reminderDate.getTime();
          
          // Calculate relative time
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const days = Math.floor(hours / 24);
          
          let timeText = '';
          if (days > 0) {
            timeText = `${days}d before`;
          } else if (hours > 0) {
            timeText = `${hours}h before`;
          } else {
            const minutes = Math.floor(timeDiff / (1000 * 60));
            timeText = `${minutes}m before`;
          }
          
          return (
            <Badge variant="outline" className="text-xs">
              {timeText}
            </Badge>
          );
        },
        enableSorting: false,
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      
      if (newSorting.length > 0) {
        const { id, desc } = newSorting[0];
        onSortChange?.(id, desc ? 'desc' : 'asc');
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium">
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center space-x-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground">
                            {{
                              asc: ' ↑',
                              desc: ' ↓',
                            }[header.column.getIsSorted() as string] ?? ' ↕'}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <span>Loading events...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} events
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(totalPages)}
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}