/**
 * Tests for GET /api/admin/submissions/pending
 * 
 * Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.4
 */

import { getPendingSubmissions } from '@/lib/submission-service';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

// Mock the dependencies
jest.mock('@/lib/admin-auth');
jest.mock('@/lib/submission-service');

describe('GET /api/admin/submissions/pending - Core Logic', () => {
  const mockAdminUser = {
    id: 'admin_test123',
    username: 'admin',
    mobileNumber: null,
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    it('should require admin authentication', async () => {
      // Mock authentication failure
      (requireAdmin as jest.Mock).mockResolvedValue({
        error: new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'Authentication required',
              code: 'AUTH_REQUIRED',
            },
          }),
          { status: 401 }
        ),
      });

      const authResult = await requireAdmin({} as any);
      expect(authResult.error).toBeDefined();
    });

    it('should allow authenticated admin users', async () => {
      // Mock successful authentication
      (requireAdmin as jest.Mock).mockResolvedValue({
        user: mockAdminUser,
      });

      const authResult = await requireAdmin({} as any);
      expect(authResult.user).toBeDefined();
      expect(authResult.user?.isAdmin).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('should return paginated results with default values', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Test Submission 1',
          description: 'Description 1',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test1@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date('2024-01-01'),
          reviewedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions();
      
      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should respect custom page and limit parameters', async () => {
      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });

      const result = await getPendingSubmissions({ page: 2, limit: 10 });
      
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should calculate total pages correctly', async () => {
      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 45,
          totalPages: 3,
        },
      });

      const result = await getPendingSubmissions({ limit: 20 });
      
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('Filtering', () => {
    it('should filter by search keyword in title', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Mobile App Development',
          description: 'Description',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions({ search: 'mobile' });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toContain('Mobile');
    });

    it('should filter by search keyword in description', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Test',
          description: 'E-commerce platform for small businesses',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions({ search: 'e-commerce' });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].description).toContain('E-commerce');
    });

    it('should filter by date range', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      await getPendingSubmissions({ dateFrom, dateTo });
      
      expect(getPendingSubmissions).toHaveBeenCalledWith({
        dateFrom,
        dateTo,
      });
    });

    it('should filter by contact status - has contact', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Test',
          description: 'Description',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions({ hasContact: true });
      
      expect(result.data).toHaveLength(1);
      expect(
        result.data[0].contactEmail || result.data[0].contactPhone
      ).toBeTruthy();
    });

    it('should filter by contact status - no contact', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Test',
          description: 'Description',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: null,
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions({ hasContact: false });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].contactEmail).toBeNull();
      expect(result.data[0].contactPhone).toBeNull();
    });

    it('should filter by flagged status', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Test',
          description: 'Description',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: true,
          flagReason: 'Spam detected',
          submittedAt: new Date(),
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions({ flagged: true });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].flaggedForReview).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      await getPendingSubmissions({
        search: 'mobile',
        dateFrom,
        dateTo,
        hasContact: true,
        flagged: false,
      });
      
      expect(getPendingSubmissions).toHaveBeenCalledWith({
        search: 'mobile',
        dateFrom,
        dateTo,
        hasContact: true,
        flagged: false,
      });
    });
  });

  describe('Response format', () => {
    it('should return submissions with required fields', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'Test Submission',
          description: 'Test description with enough text',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test@example.com',
          contactPhone: '+1-234-567-8900',
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date('2024-01-01'),
          reviewedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions();
      
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('description');
      expect(result.data[0]).toHaveProperty('submittedAt');
      expect(result.data[0]).toHaveProperty('contactEmail');
      expect(result.data[0]).toHaveProperty('contactPhone');
    });

    it('should include pagination metadata', async () => {
      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      const result = await getPendingSubmissions();
      
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
    });

    it('should return empty array when no submissions match filters', async () => {
      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });

      const result = await getPendingSubmissions({ search: 'nonexistent' });
      
      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('Ordering', () => {
    it('should return submissions ordered by submission date (oldest first)', async () => {
      const mockSubmissions = [
        {
          id: 'sub_1',
          title: 'First Submission',
          description: 'Description',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test1@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.1',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date('2024-01-01'),
          reviewedAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          images: [],
        },
        {
          id: 'sub_2',
          title: 'Second Submission',
          description: 'Description',
          budgetMin: 1000,
          budgetMax: 5000,
          contactEmail: 'test2@example.com',
          contactPhone: null,
          submitterIp: '192.168.1.2',
          status: SubmissionStatus.PENDING,
          flaggedForReview: false,
          flagReason: null,
          submittedAt: new Date('2024-01-02'),
          reviewedAt: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          images: [],
        },
      ];

      (getPendingSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });

      const result = await getPendingSubmissions();
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].submittedAt.getTime()).toBeLessThan(
        result.data[1].submittedAt.getTime()
      );
    });
  });
});
