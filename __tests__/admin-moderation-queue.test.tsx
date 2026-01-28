import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminModerationQueue } from '@/components/admin/AdminModerationQueue';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock authenticatedFetch
jest.mock('@/lib/api-client', () => ({
  authenticatedFetch: jest.fn(),
}));

import { authenticatedFetch } from '@/lib/api-client';

describe('AdminModerationQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (authenticatedFetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AdminModerationQueue />);
    
    // In loading state, the title is replaced with a skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display submissions when loaded', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [
          {
            id: 'sub1',
            title: 'Test Submission',
            description: 'This is a test submission description',
            budgetMin: 10000,
            budgetMax: 50000,
            contactEmail: 'test@example.com',
            contactPhone: null,
            submitterIp: '127.0.0.1',
            status: 'PENDING',
            rejectionReason: null,
            flaggedForReview: false,
            flagReason: null,
            approvedById: null,
            rejectedById: null,
            businessIdeaId: null,
            submittedAt: new Date('2024-01-15T10:00:00Z'),
            reviewedAt: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Test Submission')).toBeInTheDocument();
    });

    expect(screen.getByText(/This is a test submission/)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    // Check that submission count is displayed (text is split across elements)
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
  });

  it('should display flagged badge for flagged submissions', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [
          {
            id: 'sub1',
            title: 'Flagged Submission',
            description: 'This submission is flagged',
            budgetMin: 10000,
            budgetMax: 50000,
            contactEmail: 'test@example.com',
            contactPhone: null,
            submitterIp: '127.0.0.1',
            status: 'PENDING',
            rejectionReason: null,
            flaggedForReview: true,
            flagReason: 'Spam detected',
            approvedById: null,
            rejectedById: null,
            businessIdeaId: null,
            submittedAt: new Date('2024-01-15T10:00:00Z'),
            reviewedAt: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      // Look for the flagged badge in the table cell, not the filter label
      const flaggedBadges = screen.getAllByText('Flagged');
      const tableFlaggedBadge = flaggedBadges.find(
        (el) => el.className.includes('bg-amber-100')
      );
      expect(tableFlaggedBadge).toBeInTheDocument();
    });
  });

  it('should display empty state when no submissions', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText(/No pending submissions found/)).toBeInTheDocument();
    });
  });

  it('should handle search filter', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search title or description...')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search title or description...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for debounce
    await waitFor(
      () => {
        expect(authenticatedFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=test+query')
        );
      },
      { timeout: 1000 }
    );
  });

  it('should navigate to detail view when clicking View Details', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [
          {
            id: 'sub1',
            title: 'Test Submission',
            description: 'Test description',
            budgetMin: 10000,
            budgetMax: 50000,
            contactEmail: 'test@example.com',
            contactPhone: null,
            submitterIp: '127.0.0.1',
            status: 'PENDING',
            rejectionReason: null,
            flaggedForReview: false,
            flagReason: null,
            approvedById: null,
            rejectedById: null,
            businessIdeaId: null,
            submittedAt: new Date('2024-01-15T10:00:00Z'),
            reviewedAt: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/submissions/sub1');
  });

  it('should display error state on fetch failure', async () => {
    (authenticatedFetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText('An error occurred while loading submissions')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [
          {
            id: 'sub1',
            title: 'Test Submission',
            description: 'Test description',
            budgetMin: 10000,
            budgetMax: 50000,
            contactEmail: 'test@example.com',
            contactPhone: null,
            submitterIp: '127.0.0.1',
            status: 'PENDING',
            rejectionReason: null,
            flaggedForReview: false,
            flagReason: null,
            approvedById: null,
            rejectedById: null,
            businessIdeaId: null,
            submittedAt: new Date('2024-01-15T10:00:00Z'),
            reviewedAt: null,
            createdAt: new Date('2024-01-15T10:00:00Z'),
            updatedAt: new Date('2024-01-15T10:00:00Z'),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Use getAllByRole to get buttons, then filter by accessible name
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));
    const prevButton = buttons.find(btn => btn.textContent?.includes('Previous') || btn.textContent?.includes('Prev'));
    
    expect(nextButton).toBeEnabled();
    expect(prevButton).toBeDisabled();

    fireEvent.click(nextButton!);

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
    });
  });

  it('should clear all filters when clicking Clear Filters', async () => {
    const mockSubmissions = {
      success: true,
      data: {
        submissions: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    };

    (authenticatedFetch as jest.Mock).mockResolvedValue({
      json: async () => mockSubmissions,
    });

    render(<AdminModerationQueue />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search title or description...')).toBeInTheDocument();
    });

    // Set some filters
    const searchInput = screen.getByPlaceholderText('Search title or description...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Verify search is cleared
    expect(searchInput).toHaveValue('');
  });
});
