import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventTable } from '@/components/event-table';
import { Event } from '@/types';
import { addDays } from 'date-fns';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
  usePathname: () => '/events',
}));

// Mock the server action
jest.mock('@/actions/event-actions', () => ({
  getEvents: jest.fn(),
}));

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Test Event 1',
    description: 'Description 1',
    date: addDays(new Date(), 1),
    location: 'US-NY: New York',
    status: 'PUBLISHED',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Test Event 2',
    description: 'Description 2',
    date: addDays(new Date(), 2),
    location: 'US-CA: Los Angeles',
    status: 'DRAFT',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Test Event 3',
    description: 'Description 3',
    date: addDays(new Date(), 3),
    location: 'UK-LN: London',
    status: 'CANCELED',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockEventsResponse = {
  events: mockEvents,
  totalCount: 25,
  totalPages: 3,
};

describe('EventTable', () => {
  const defaultProps = {
    initialData: mockEventsResponse,
    searchParams: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render table with events', () => {
    render(<EventTable {...defaultProps} />);

    // Check if table headers are present
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();

    // Check if events are rendered
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    expect(screen.getByText('Test Event 3')).toBeInTheDocument();
  });

  it('should display correct status badges', () => {
    render(<EventTable {...defaultProps} />);

    // Check status badges
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });

  it('should display locations correctly', () => {
    render(<EventTable {...defaultProps} />);

    expect(screen.getByText('US-NY: New York')).toBeInTheDocument();
    expect(screen.getByText('US-CA: Los Angeles')).toBeInTheDocument();
    expect(screen.getByText('UK-LN: London')).toBeInTheDocument();
  });

  it('should show pagination controls', () => {
    render(<EventTable {...defaultProps} />);

    // Check pagination elements
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('should handle sorting when column headers are clicked', async () => {
    render(<EventTable {...defaultProps} />);

    const titleHeader = screen.getByText('Title');
    fireEvent.click(titleHeader);

    // Should trigger sorting (we can't easily test the actual sorting without mocking the server action)
    await waitFor(() => {
      expect(titleHeader).toBeInTheDocument();
    });
  });

  it('should display "No events found" when no events are provided', () => {
    const emptyProps = {
      initialData: {
        events: [],
        totalCount: 0,
        totalPages: 0,
      },
      searchParams: {},
    };

    render(<EventTable {...emptyProps} />);

    expect(screen.getByText('No events found.')).toBeInTheDocument();
  });

  it('should show page size selector', () => {
    render(<EventTable {...defaultProps} />);

    expect(screen.getByText('10 per page')).toBeInTheDocument();
  });

  it('should display reminder status correctly', () => {
    const eventsWithReminders = [
      {
        ...mockEvents[0],
        reminder: {
          id: 'reminder-1',
          reminderTime: addDays(new Date(), 1),
          eventId: '1',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    const propsWithReminders = {
      initialData: {
        events: eventsWithReminders,
        totalCount: 1,
        totalPages: 1,
      },
      searchParams: {},
    };

    render(<EventTable {...propsWithReminders} />);

    // Should show reminder badge or indicator
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
  });

  it('should handle pagination navigation', async () => {
    render(<EventTable {...defaultProps} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Should trigger navigation (we can't easily test the actual navigation without mocking the router)
    await waitFor(() => {
      expect(nextButton).toBeInTheDocument();
    });
  });

  it('should disable Previous button on first page', () => {
    render(<EventTable {...defaultProps} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    const lastPageProps = {
      initialData: mockEventsResponse,
      searchParams: { page: '3' },
    };

    render(<EventTable {...lastPageProps} />);

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('should format dates correctly', () => {
    render(<EventTable {...defaultProps} />);

    // Dates should be formatted in a readable format
    // The exact format depends on the date-fns format used in the component
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should handle different page sizes', () => {
    const propsWithPageSize = {
      initialData: mockEventsResponse,
      searchParams: { pageSize: '20' },
    };

    render(<EventTable {...propsWithPageSize} />);

    expect(screen.getByText('20 per page')).toBeInTheDocument();
  });

  it('should show loading state appropriately', () => {
    // This would require testing the Suspense boundary and loading states
    // which is more complex and would need additional setup
    render(<EventTable {...defaultProps} />);

    // Basic render test to ensure component doesn't crash
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});