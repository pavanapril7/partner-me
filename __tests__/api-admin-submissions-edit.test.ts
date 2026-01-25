/**
 * Tests for PATCH /api/admin/submissions/[id]
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { PATCH } from '@/app/api/admin/submissions/[id]/route';
import { updateSubmission } from '@/lib/submission-service';
import * as adminAuth from '@/lib/admin-auth';

// Mock dependencies
jest.mock('@/lib/admin-auth');
jest.mock('@/lib/submission-service');

describe('PATCH /api/admin/submissions/[id]', () => {
  const mockAdminUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
  };

  const mockSubmission = {
    id: 'submission-123',
    title: 'Updated Title',
    description: 'Updated description',
    budgetMin: 2000,
    budgetMax: 8000,
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
    submittedAt: new Date('2024-01-01T00:00:00Z'),
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuth.requireAdmin as jest.Mock).mockResolvedValue({
      user: mockAdminUser,
      error: null,
    });
  });

  describe('Success cases', () => {
    it('should update submission and return 200', async () => {
      (updateSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.submission).toMatchObject({
        id: mockSubmission.id,
        title: mockSubmission.title,
        description: mockSubmission.description,
        budgetMin: mockSubmission.budgetMin,
        budgetMax: mockSubmission.budgetMax,
        contactEmail: mockSubmission.contactEmail,
        contactPhone: mockSubmission.contactPhone,
        submitterIp: mockSubmission.submitterIp,
        status: mockSubmission.status,
      });
      expect(updateSubmission).toHaveBeenCalledWith(
        'submission-123',
        mockAdminUser.id,
        { title: 'Updated Title' }
      );
    });

    it('should handle multiple field updates', async () => {
      (updateSubmission as jest.Mock).mockResolvedValue(mockSubmission);

      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          budgetMin: 2000,
          budgetMax: 8000,
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updateSubmission).toHaveBeenCalledWith(
        'submission-123',
        mockAdminUser.id,
        {
          title: 'Updated Title',
          description: 'Updated description',
          budgetMin: 2000,
          budgetMax: 8000,
        }
      );
    });
  });

  describe('Validation errors', () => {
    it('should reject empty title', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: '',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields.title).toBeDefined();
    });

    it('should reject title that is too long', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'a'.repeat(201),
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject description that is too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'short',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject budgetMin > budgetMax', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          budgetMin: 10000,
          budgetMax: 5000,
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          contactEmail: 'invalid-email',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid phone format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          contactPhone: '123',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error cases', () => {
    it('should return 404 for non-existent submission', async () => {
      (updateSubmission as jest.Mock).mockRejectedValue(new Error('Submission not found'));

      const request = new NextRequest('http://localhost:3000/api/admin/submissions/non-existent-id', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      const response = await PATCH(request, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SUBMISSION_NOT_FOUND');
    });

    it('should return 409 for already processed submission', async () => {
      (updateSubmission as jest.Mock).mockRejectedValue(
        new Error('Cannot edit submission with status APPROVED. Only PENDING submissions can be edited.')
      );

      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SUBMISSION_ALREADY_PROCESSED');
    });

    it('should return 401 when not authenticated', async () => {
      (adminAuth.requireAdmin as jest.Mock).mockResolvedValue({
        user: null,
        error: NextResponse.json(
          { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
          { status: 401 }
        ),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/submissions/submission-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      const response = await PATCH(request, { params: { id: 'submission-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });
});
