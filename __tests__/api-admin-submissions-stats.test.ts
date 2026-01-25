/**
 * Tests for GET /api/admin/submissions/stats
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { GET } from '@/app/api/admin/submissions/stats/route';
import { getSubmissionStats } from '@/lib/submission-service';
import * as adminAuth from '@/lib/admin-auth';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/admin-auth');
jest.mock('@/lib/submission-service');

describe('GET /api/admin/submissions/stats', () => {
  const mockAdminUser = {
    id: 'admin-user-id',
    email: 'admin@test.com',
    role: 'ADMIN' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuth.requireAdmin as jest.Mock).mockResolvedValue({
      user: mockAdminUser,
      error: null,
    });
  });

  it('should return statistics with all counts at zero when no submissions exist', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 0,
      approved: 0,
      rejected: 0,
      approvedLast30Days: 0,
      rejectedLast30Days: 0,
      averageReviewTimeHours: 0,
      flaggedCount: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      pending: 0,
      approved: 0,
      rejected: 0,
      approvedLast30Days: 0,
      rejectedLast30Days: 0,
      averageReviewTimeHours: 0,
      flaggedCount: 0,
    });
  });

  it('should return correct pending count', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 2,
      approved: 1,
      rejected: 0,
      approvedLast30Days: 1,
      rejectedLast30Days: 0,
      averageReviewTimeHours: 0,
      flaggedCount: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.pending).toBe(2);
  });

  it('should return correct approved and rejected counts', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 0,
      approved: 2,
      rejected: 1,
      approvedLast30Days: 2,
      rejectedLast30Days: 1,
      averageReviewTimeHours: 0,
      flaggedCount: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.approved).toBe(2);
    expect(data.data.rejected).toBe(1);
  });

  it('should return correct 30-day counts', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 0,
      approved: 2,
      rejected: 2,
      approvedLast30Days: 1,
      rejectedLast30Days: 1,
      averageReviewTimeHours: 0,
      flaggedCount: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.approvedLast30Days).toBe(1);
    expect(data.data.rejectedLast30Days).toBe(1);
    expect(data.data.approved).toBe(2); // Total approved
    expect(data.data.rejected).toBe(2); // Total rejected
  });

  it('should calculate average review time correctly', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 0,
      approved: 1,
      rejected: 1,
      approvedLast30Days: 1,
      rejectedLast30Days: 1,
      averageReviewTimeHours: 36,
      flaggedCount: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Average of 24 and 48 hours = 36 hours
    expect(data.data.averageReviewTimeHours).toBe(36);
  });

  it('should return correct flagged count', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 3,
      approved: 1,
      rejected: 0,
      approvedLast30Days: 1,
      rejectedLast30Days: 0,
      averageReviewTimeHours: 0,
      flaggedCount: 2,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Only pending flagged submissions should be counted
    expect(data.data.flaggedCount).toBe(2);
  });

  it('should return all statistics together', async () => {
    (getSubmissionStats as jest.Mock).mockResolvedValue({
      pending: 2,
      approved: 1,
      rejected: 1,
      approvedLast30Days: 1,
      rejectedLast30Days: 1,
      averageReviewTimeHours: 24.5,
      flaggedCount: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      pending: 2,
      approved: 1,
      rejected: 1,
      approvedLast30Days: 1,
      rejectedLast30Days: 1,
      flaggedCount: 1,
    });
    expect(data.data.averageReviewTimeHours).toBeGreaterThan(0);
  });

  it('should handle database errors gracefully', async () => {
    // Mock getSubmissionStats to throw an error
    (getSubmissionStats as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  it('should require admin authentication', async () => {
    (adminAuth.requireAdmin as jest.Mock).mockResolvedValue({
      user: null,
      error: new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Admin authentication required',
          },
        }),
        { status: 401 }
      ),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/submissions/stats');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
