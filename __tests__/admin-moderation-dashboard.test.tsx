import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminModerationDashboard } from '@/components/admin/AdminModerationDashboard';
import { authenticatedFetch } from '@/lib/api-client';

// Mock the api-client
jest.mock('@/lib/api-client');
const mockAuthenticatedFetch = authenticatedFetch as jest.MockedFunction<
  typeof authenticatedFetch
>;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('AdminModerationDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockStats = {
    pending: 5,
    approved: 20,
    rejected: 3,
    approvedLast30Days: 15,
    rejectedLast30Days: 2,
    averageReviewTimeHours: 24.5,
    flaggedCount: 2,
  };

  it('should render loading state initially', () => {
    mockAuthenticatedFetch.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }) as any
    );

    render(<AdminModerationDashboard />);

    // Check for skeleton elements by class name
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display statistics cards with correct data', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    // Check pending submissions
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Awaiting review')).toBeInTheDocument();

    // Check flagged count (use getAllByText since there are multiple "2"s)
    const twoElements = screen.getAllByText('2');
    expect(twoElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Requires attention')).toBeInTheDocument();

    // Check approved last 30 days
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Published ideas')).toBeInTheDocument();

    // Check rejected last 30 days
    expect(screen.getByText('Not published')).toBeInTheDocument();
  });

  it('should display average review time', async () => {
    const goodReviewTimeStats = {
      ...mockStats,
      averageReviewTimeHours: 20, // Changed to 20 to trigger excellent message
    };

    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: goodReviewTimeStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Average Review Time')).toBeInTheDocument();
    });

    expect(screen.getByText('20.0')).toBeInTheDocument();
    expect(screen.getByText('hours')).toBeInTheDocument();
    // Check for the excellent response time message (it's conditional)
    // Since averageReviewTimeHours is 20, it should show the excellent message
    expect(screen.queryByText(/Excellent response time/)).toBeInTheDocument();
  });

  it('should display warning when review time is high', async () => {
    const highReviewTimeStats = {
      ...mockStats,
      averageReviewTimeHours: 72,
    };

    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: highReviewTimeStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('⚠️ Review time is above target (48 hours)')
      ).toBeInTheDocument();
    });
  });

  it('should display 30-day trends', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('30-Day Trends')).toBeInTheDocument();
    });

    // Total reviewed = 15 + 2 = 17
    expect(screen.getByText('17')).toBeInTheDocument();

    // Approval rate = 15 / 17 * 100 = 88.2%
    expect(screen.getByText('88.2%')).toBeInTheDocument();

    // All-time approved
    expect(screen.getByText('20')).toBeInTheDocument();

    // All-time rejected
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display action prompt when there are pending submissions', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('You have 5 submissions waiting for review')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('2 flagged for potential issues')
    ).toBeInTheDocument();
  });

  it('should not display action prompt when there are no pending submissions', async () => {
    const noPendingStats = {
      ...mockStats,
      pending: 0,
      flaggedCount: 0,
    };

    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: noPendingStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/waiting for review/)
    ).not.toBeInTheDocument();
  });

  it('should navigate to moderation queue when clicking View Moderation Queue button', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    const viewQueueButtons = screen.getAllByText('View Moderation Queue');
    fireEvent.click(viewQueueButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/admin/submissions');
  });

  it('should navigate to moderation queue when clicking Review Now button', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Review Now')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Review Now'));

    expect(mockPush).toHaveBeenCalledWith('/admin/submissions');
  });

  it('should display error state when API call fails', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: false,
        error: {
          message: 'Failed to load statistics',
        },
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
    });

    expect(
      screen.getByText('There was a problem loading the statistics. Please try again.')
    ).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should retry fetching stats when clicking Retry button', async () => {
    mockAuthenticatedFetch
      .mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: {
            message: 'Failed to load statistics',
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: mockStats,
        }),
      } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should auto-refresh statistics every 30 seconds', async () => {
    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: mockStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Moderation Dashboard')).toBeInTheDocument();
    });

    // Initial call
    expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(2);
    });

    // Fast-forward another 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockAuthenticatedFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle zero approval rate correctly', async () => {
    const zeroReviewStats = {
      ...mockStats,
      approvedLast30Days: 0,
      rejectedLast30Days: 0,
    };

    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: zeroReviewStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('30-Day Trends')).toBeInTheDocument();
    });

    // Should display 0% approval rate
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should display correct singular text for 1 pending submission', async () => {
    const onePendingStats = {
      ...mockStats,
      pending: 1,
    };

    mockAuthenticatedFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: onePendingStats,
      }),
    } as Response);

    render(<AdminModerationDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('You have 1 submission waiting for review')
      ).toBeInTheDocument();
    });
  });
});
