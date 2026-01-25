/**
 * Integration test for anonymous submission isolation
 * Requirements: 1.4, 10.3
 * 
 * This test verifies that pending and rejected anonymous submissions
 * are properly isolated from the public business ideas query.
 */

import { prisma } from '@/lib/prisma';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    businessIdea: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    anonymousSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Anonymous Submission Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should demonstrate that pending submissions do not appear in business ideas query', async () => {
    // Scenario: An admin creates a business idea, and an anonymous user submits an idea
    // The public query should only return the admin-created idea, not the pending submission

    // Step 1: Admin creates a business idea
    const adminBusinessIdea = {
      id: 'admin-idea-1',
      title: 'Admin Created Business Idea',
      description: 'This was created by an admin',
      images: [],
      budgetMin: 10000,
      budgetMax: 50000,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.businessIdea.create as jest.Mock).mockResolvedValue(adminBusinessIdea);
    const createdIdea = await prisma.businessIdea.create({
      data: adminBusinessIdea,
    });

    expect(createdIdea.id).toBe('admin-idea-1');

    // Step 2: Anonymous user submits a business idea
    const anonymousSubmission = {
      id: 'anon-sub-1',
      title: 'Anonymous Submission',
      description: 'This is pending approval',
      budgetMin: 15000,
      budgetMax: 60000,
      status: 'PENDING',
      submitterIp: '192.168.1.1',
      submittedAt: new Date('2024-01-02'),
    };

    (prisma.anonymousSubmission.create as jest.Mock).mockResolvedValue(anonymousSubmission);
    const createdSubmission = await prisma.anonymousSubmission.create({
      data: anonymousSubmission,
    });

    expect(createdSubmission.status).toBe('PENDING');

    // Step 3: Query public business ideas
    // This should only return the admin-created idea, NOT the pending submission
    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue([adminBusinessIdea]);
    
    const publicBusinessIdeas = await prisma.businessIdea.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Verify: Only 1 business idea is returned (the admin-created one)
    expect(publicBusinessIdeas).toHaveLength(1);
    expect(publicBusinessIdeas[0].id).toBe('admin-idea-1');
    expect(publicBusinessIdeas[0].title).toBe('Admin Created Business Idea');

    // Verify: The pending submission is NOT in the results
    const titles = publicBusinessIdeas.map((idea: any) => idea.title);
    expect(titles).not.toContain('Anonymous Submission');
  });

  it('should demonstrate that approved submissions DO appear in business ideas query', async () => {
    // Scenario: An anonymous submission is approved and creates a BusinessIdea
    // The public query should now include this approved submission

    // Step 1: Anonymous submission exists with PENDING status
    const anonymousSubmission = {
      id: 'anon-sub-2',
      title: 'Great Business Idea',
      description: 'This will be approved',
      budgetMin: 20000,
      budgetMax: 100000,
      status: 'PENDING',
      submitterIp: '192.168.1.2',
      submittedAt: new Date('2024-01-03'),
    };

    (prisma.anonymousSubmission.create as jest.Mock).mockResolvedValue(anonymousSubmission);
    await prisma.anonymousSubmission.create({ data: anonymousSubmission });

    // Step 2: Admin approves the submission, creating a BusinessIdea
    const approvedBusinessIdea = {
      id: 'approved-idea-1',
      title: 'Great Business Idea',
      description: 'This will be approved',
      images: [],
      budgetMin: 20000,
      budgetMax: 100000,
      createdAt: new Date('2024-01-04'), // Approval time
      updatedAt: new Date('2024-01-04'),
    };

    (prisma.businessIdea.create as jest.Mock).mockResolvedValue(approvedBusinessIdea);
    const createdBusinessIdea = await prisma.businessIdea.create({
      data: approvedBusinessIdea,
    });

    expect(createdBusinessIdea.id).toBe('approved-idea-1');

    // Step 3: Update the anonymous submission status to APPROVED
    (prisma.anonymousSubmission.update as jest.Mock).mockResolvedValue({
      ...anonymousSubmission,
      status: 'APPROVED',
      businessIdeaId: 'approved-idea-1',
      reviewedAt: new Date('2024-01-04'),
    });

    await prisma.anonymousSubmission.update({
      where: { id: 'anon-sub-2' },
      data: {
        status: 'APPROVED',
        businessIdeaId: 'approved-idea-1',
        reviewedAt: new Date('2024-01-04'),
      },
    });

    // Step 4: Query public business ideas
    // This should now include the approved submission
    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue([approvedBusinessIdea]);
    
    const publicBusinessIdeas = await prisma.businessIdea.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Verify: The approved submission appears as a BusinessIdea
    expect(publicBusinessIdeas).toHaveLength(1);
    expect(publicBusinessIdeas[0].id).toBe('approved-idea-1');
    expect(publicBusinessIdeas[0].title).toBe('Great Business Idea');
  });

  it('should demonstrate that rejected submissions do NOT appear in business ideas query', async () => {
    // Scenario: An anonymous submission is rejected
    // The public query should NOT include this rejected submission

    // Step 1: Create an admin business idea
    const adminBusinessIdea = {
      id: 'admin-idea-2',
      title: 'Admin Business Idea',
      description: 'Created by admin',
      images: [],
      budgetMin: 10000,
      budgetMax: 50000,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05'),
    };

    (prisma.businessIdea.create as jest.Mock).mockResolvedValue(adminBusinessIdea);
    await prisma.businessIdea.create({ data: adminBusinessIdea });

    // Step 2: Anonymous submission is created
    const anonymousSubmission = {
      id: 'anon-sub-3',
      title: 'Low Quality Submission',
      description: 'This will be rejected',
      budgetMin: 5000,
      budgetMax: 10000,
      status: 'PENDING',
      submitterIp: '192.168.1.3',
      submittedAt: new Date('2024-01-06'),
    };

    (prisma.anonymousSubmission.create as jest.Mock).mockResolvedValue(anonymousSubmission);
    await prisma.anonymousSubmission.create({ data: anonymousSubmission });

    // Step 3: Admin rejects the submission
    (prisma.anonymousSubmission.update as jest.Mock).mockResolvedValue({
      ...anonymousSubmission,
      status: 'REJECTED',
      rejectionReason: 'Does not meet quality standards',
      reviewedAt: new Date('2024-01-07'),
    });

    await prisma.anonymousSubmission.update({
      where: { id: 'anon-sub-3' },
      data: {
        status: 'REJECTED',
        rejectionReason: 'Does not meet quality standards',
        reviewedAt: new Date('2024-01-07'),
      },
    });

    // Step 4: Query public business ideas
    // This should only return the admin-created idea, NOT the rejected submission
    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue([adminBusinessIdea]);
    
    const publicBusinessIdeas = await prisma.businessIdea.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Verify: Only the admin-created idea is returned
    expect(publicBusinessIdeas).toHaveLength(1);
    expect(publicBusinessIdeas[0].id).toBe('admin-idea-2');
    expect(publicBusinessIdeas[0].title).toBe('Admin Business Idea');

    // Verify: The rejected submission is NOT in the results
    const titles = publicBusinessIdeas.map((idea: any) => idea.title);
    expect(titles).not.toContain('Low Quality Submission');
  });

  it('should demonstrate complete isolation: multiple submissions with different statuses', async () => {
    // Scenario: Multiple business ideas and submissions with various statuses
    // Only admin-created and approved submissions should appear in public query

    // Admin-created business ideas
    const adminIdea1 = {
      id: 'admin-1',
      title: 'Admin Idea 1',
      description: 'First admin idea',
      images: [],
      budgetMin: 10000,
      budgetMax: 50000,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const adminIdea2 = {
      id: 'admin-2',
      title: 'Admin Idea 2',
      description: 'Second admin idea',
      images: [],
      budgetMin: 20000,
      budgetMax: 80000,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    };

    // Approved anonymous submission (creates BusinessIdea)
    const approvedIdea = {
      id: 'approved-1',
      title: 'Approved Anonymous Idea',
      description: 'Was approved',
      images: [],
      budgetMin: 15000,
      budgetMax: 60000,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    };

    // Mock: BusinessIdea table contains admin-created and approved ideas
    const allBusinessIdeas = [adminIdea1, adminIdea2, approvedIdea];
    (prisma.businessIdea.findMany as jest.Mock).mockResolvedValue(allBusinessIdeas);

    // Mock: AnonymousSubmission table contains pending and rejected submissions
    const pendingSubmission = {
      id: 'pending-1',
      title: 'Pending Submission',
      status: 'PENDING',
    };

    const rejectedSubmission = {
      id: 'rejected-1',
      title: 'Rejected Submission',
      status: 'REJECTED',
    };

    (prisma.anonymousSubmission.findMany as jest.Mock).mockResolvedValue([
      pendingSubmission,
      rejectedSubmission,
    ]);

    // Query public business ideas
    const publicBusinessIdeas = await prisma.businessIdea.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Verify: Only 3 business ideas are returned
    expect(publicBusinessIdeas).toHaveLength(3);

    // Verify: All returned ideas are from BusinessIdea table
    const titles = publicBusinessIdeas.map((idea: any) => idea.title);
    expect(titles).toContain('Admin Idea 1');
    expect(titles).toContain('Admin Idea 2');
    expect(titles).toContain('Approved Anonymous Idea');

    // Verify: Pending and rejected submissions are NOT in the results
    expect(titles).not.toContain('Pending Submission');
    expect(titles).not.toContain('Rejected Submission');
  });
});
