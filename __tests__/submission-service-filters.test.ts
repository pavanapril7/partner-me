/**
 * Integration tests for getPendingSubmissions filter combinations
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { prisma } from '@/lib/prisma';
import { getPendingSubmissions, createAnonymousSubmission } from '@/lib/submission-service';
import { SubmissionStatus } from '@prisma/client';

describe('getPendingSubmissions - Filter Combinations', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.submissionAuditLog.deleteMany({});
    await prisma.anonymousSubmissionImage.deleteMany({});
    await prisma.anonymousSubmission.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should combine search and hasContact filters', async () => {
    // Create test submissions
    await createAnonymousSubmission({
      title: 'Mobile App Development',
      description: 'A mobile app for tracking fitness',
      budgetMin: 1000,
      budgetMax: 5000,
      contactEmail: 'user1@example.com',
      submitterIp: '192.168.1.1',
      imageIds: [],
    });

    await createAnonymousSubmission({
      title: 'Mobile Game',
      description: 'A fun mobile game',
      budgetMin: 2000,
      budgetMax: 6000,
      contactEmail: null,
      contactPhone: null,
      submitterIp: '192.168.1.2',
      imageIds: [],
    });

    await createAnonymousSubmission({
      title: 'Web Platform',
      description: 'An e-commerce platform',
      budgetMin: 3000,
      budgetMax: 7000,
      contactEmail: 'user3@example.com',
      submitterIp: '192.168.1.3',
      imageIds: [],
    });

    // Search for "mobile" with contact information
    const result = await getPendingSubmissions({
      search: 'mobile',
      hasContact: true,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Mobile App Development');
    expect(result.data[0].contactEmail).toBeTruthy();
  });

  it('should combine search, dateRange, and flagged filters', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create submissions with different dates
    const sub1 = await prisma.anonymousSubmission.create({
      data: {
        title: 'Mobile App',
        description: 'Description',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'test@example.com',
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        flaggedForReview: true,
        flagReason: 'Spam detected',
        submittedAt: new Date(),
      },
    });

    const sub2 = await prisma.anonymousSubmission.create({
      data: {
        title: 'Mobile Game',
        description: 'Description',
        budgetMin: 2000,
        budgetMax: 6000,
        contactEmail: 'test2@example.com',
        submitterIp: '192.168.1.2',
        status: SubmissionStatus.PENDING,
        flaggedForReview: false,
        submittedAt: new Date(),
      },
    });

    const sub3 = await prisma.anonymousSubmission.create({
      data: {
        title: 'Web App',
        description: 'Description',
        budgetMin: 3000,
        budgetMax: 7000,
        contactEmail: 'test3@example.com',
        submitterIp: '192.168.1.3',
        status: SubmissionStatus.PENDING,
        flaggedForReview: true,
        flagReason: 'Spam detected',
        submittedAt: yesterday,
      },
    });

    // Search for "mobile" that are flagged and within date range
    const result = await getPendingSubmissions({
      search: 'mobile',
      flagged: true,
      dateFrom: yesterday,
      dateTo: tomorrow,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(sub1.id);
    expect(result.data[0].title).toContain('Mobile');
    expect(result.data[0].flaggedForReview).toBe(true);
  });

  it('should combine all filters together', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create various submissions
    await prisma.anonymousSubmission.create({
      data: {
        title: 'Mobile App Development',
        description: 'A mobile app for tracking',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: 'user1@example.com',
        submitterIp: '192.168.1.1',
        status: SubmissionStatus.PENDING,
        flaggedForReview: false,
        submittedAt: new Date(),
      },
    });

    const targetSubmission = await prisma.anonymousSubmission.create({
      data: {
        title: 'Mobile Game Platform',
        description: 'A mobile gaming platform',
        budgetMin: 2000,
        budgetMax: 6000,
        contactEmail: 'user2@example.com',
        submitterIp: '192.168.1.2',
        status: SubmissionStatus.PENDING,
        flaggedForReview: true,
        flagReason: 'Spam detected',
        submittedAt: new Date(),
      },
    });

    await prisma.anonymousSubmission.create({
      data: {
        title: 'Web Platform',
        description: 'An e-commerce platform',
        budgetMin: 3000,
        budgetMax: 7000,
        contactEmail: 'user3@example.com',
        submitterIp: '192.168.1.3',
        status: SubmissionStatus.PENDING,
        flaggedForReview: true,
        flagReason: 'Spam detected',
        submittedAt: new Date(),
      },
    });

    // Apply all filters
    const result = await getPendingSubmissions({
      search: 'mobile',
      hasContact: true,
      flagged: true,
      dateFrom: yesterday,
      dateTo: tomorrow,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(targetSubmission.id);
    expect(result.data[0].title).toContain('Mobile');
    expect(result.data[0].contactEmail).toBeTruthy();
    expect(result.data[0].flaggedForReview).toBe(true);
  });

  it('should return correct count with combined filters', async () => {
    // Create multiple submissions
    for (let i = 0; i < 5; i++) {
      await createAnonymousSubmission({
        title: `Mobile App ${i}`,
        description: 'A mobile application',
        budgetMin: 1000,
        budgetMax: 5000,
        contactEmail: `user${i}@example.com`,
        submitterIp: `192.168.1.${i}`,
        imageIds: [],
      });
    }

    for (let i = 0; i < 3; i++) {
      await createAnonymousSubmission({
        title: `Web App ${i}`,
        description: 'A web application',
        budgetMin: 2000,
        budgetMax: 6000,
        contactEmail: `webuser${i}@example.com`,
        submitterIp: `192.168.2.${i}`,
        imageIds: [],
      });
    }

    // Filter by search
    const result = await getPendingSubmissions({
      search: 'mobile',
    });

    expect(result.pagination.total).toBe(5);
    expect(result.data).toHaveLength(5);
  });
});
