/**
 * Tests for AdminSubmissionDetail component
 * Requirements: 3.3, 4.1, 5.1, 5.3, 6.1
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AdminSubmissionDetail } from '@/components/admin/AdminSubmissionDetail';
import { authenticatedFetch } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/lib/api-client');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAuthenticatedFetch = authenticatedFetch as jest.MockedFunction<typeof authenticatedFetch>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('AdminSubmissionDetail', () => {
  const mockPush = jest.fn();
  const mockSubmission = {
    id: 'sub_123',
    title: 'Test Business Idea',
    description: '<p>This is a test description</p>',
    budgetMin: 10000,
    budgetMax: 50000,
    contactEmail: 'test@example.com',
    contactPhone: '+1234567890',
    submitterIp: '127.0.0.1',
    status: 'PENDING' as const,
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
    images: [
      {
        id: 'img_1',
        imageId: 'image_123',
        order: 0,
        image: {
          id: 'image_123',
          filename: 'test.jpg',
          storagePath: '/uploads/test.jpg',
          mimeType: 'image/jpeg',
          width: 800,
          height: 600,
        },
      },
    ],
    auditLogs: [
      {
        id: 'log_1',
        action: 'CREATED' as const,
        performedBy: null,
        details: {},
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  it('should render loading state initially', () => {
    mockAuthenticatedFetch.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    // Check for skeleton loading elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display submission details when loaded', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should display flagged warning when submission is flagged', async () => {
    const flaggedSubmission = {
      ...mockSubmission,
      flaggedForReview: true,
      flagReason: 'Spam detection: suspicious content',
    };

    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: flaggedSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getAllByText('Flagged for Review').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Spam detection: suspicious content')).toBeInTheDocument();
  });

  it('should display images in images tab', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    // Check that Images tab exists with count
    expect(screen.getByRole('tab', { name: /Images \(1\)/i })).toBeInTheDocument();
  });

  it('should display audit log in audit tab', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    // Check that Audit Log tab exists with count
    expect(screen.getByRole('tab', { name: /Audit Log \(1\)/i })).toBeInTheDocument();
  });

  it('should enable edit mode when clicking Edit Submission', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    // Click Edit Submission button
    const editButton = screen.getByRole('button', { name: /Edit Submission/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  it('should show approve and reject buttons for pending submissions', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Approve & Publish/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject Submission/i })).toBeInTheDocument();
  });

  it('should not show action buttons for approved submissions', async () => {
    const approvedSubmission = {
      ...mockSubmission,
      status: 'APPROVED' as const,
      reviewedAt: new Date('2024-01-16T10:00:00Z'),
    };

    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: approvedSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Approve & Publish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reject Submission/i })).not.toBeInTheDocument();
  });

  it('should display rejection reason for rejected submissions', async () => {
    const rejectedSubmission = {
      ...mockSubmission,
      status: 'REJECTED' as const,
      rejectionReason: 'Does not meet quality standards',
      reviewedAt: new Date('2024-01-16T10:00:00Z'),
    };

    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: rejectedSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    expect(screen.getByText('Does not meet quality standards')).toBeInTheDocument();
  });

  it('should display error state when submission not found', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: {
          message: 'Submission not found',
        },
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Submission not found')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('should navigate back to queue when clicking Back to Queue', async () => {
    mockAuthenticatedFetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockSubmission,
      }),
    } as Response);

    render(<AdminSubmissionDetail submissionId="sub_123" />);

    await waitFor(() => {
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
    });

    const backButton = screen.getAllByRole('button', { name: /Back to Queue/i })[0];
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/submissions');
  });
});
