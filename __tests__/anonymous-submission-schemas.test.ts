import {
  anonymousSubmissionSchema,
  submissionUpdateSchema,
  submissionApprovalSchema,
  submissionRejectionSchema,
  submissionFilterSchema,
  submissionStatusSchema,
  submissionActionSchema,
} from '@/schemas/anonymous-submission.schema';

describe('Anonymous Submission Schemas', () => {
  describe('submissionStatusSchema', () => {
    it('should accept valid status values', () => {
      expect(submissionStatusSchema.parse('PENDING')).toBe('PENDING');
      expect(submissionStatusSchema.parse('APPROVED')).toBe('APPROVED');
      expect(submissionStatusSchema.parse('REJECTED')).toBe('REJECTED');
    });

    it('should reject invalid status values', () => {
      expect(() => submissionStatusSchema.parse('INVALID')).toThrow();
    });
  });

  describe('submissionActionSchema', () => {
    it('should accept valid action values', () => {
      expect(submissionActionSchema.parse('CREATED')).toBe('CREATED');
      expect(submissionActionSchema.parse('EDITED')).toBe('EDITED');
      expect(submissionActionSchema.parse('APPROVED')).toBe('APPROVED');
      expect(submissionActionSchema.parse('REJECTED')).toBe('REJECTED');
      expect(submissionActionSchema.parse('FLAGGED')).toBe('FLAGGED');
      expect(submissionActionSchema.parse('UNFLAGGED')).toBe('UNFLAGGED');
    });

    it('should reject invalid action values', () => {
      expect(() => submissionActionSchema.parse('INVALID')).toThrow();
    });
  });

  describe('anonymousSubmissionSchema', () => {
    const validSubmission = {
      title: 'Test Business Idea',
      description: 'This is a test description with enough characters',
      budgetMin: 1000,
      budgetMax: 5000,
      contactEmail: 'test@example.com',
      imageIds: ['img_123'],
    };

    it('should accept valid submission with email', () => {
      const result = anonymousSubmissionSchema.parse(validSubmission);
      expect(result.title).toBe('Test Business Idea');
      expect(result.contactEmail).toBe('test@example.com');
    });

    it('should accept valid submission with phone', () => {
      const submission = {
        ...validSubmission,
        contactEmail: '',
        contactPhone: '+1-234-567-8900',
      };
      const result = anonymousSubmissionSchema.parse(submission);
      expect(result.contactPhone).toBe('+1-234-567-8900');
    });

    it('should accept valid submission with both email and phone', () => {
      const submission = {
        ...validSubmission,
        contactPhone: '123-456-7890',
      };
      const result = anonymousSubmissionSchema.parse(submission);
      expect(result.contactEmail).toBe('test@example.com');
      expect(result.contactPhone).toBe('123-456-7890');
    });

    it('should reject submission without contact information', () => {
      const submission = {
        ...validSubmission,
        contactEmail: '',
      };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'At least one contact method'
      );
    });

    it('should reject submission with empty title', () => {
      const submission = { ...validSubmission, title: '' };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Title is required'
      );
    });

    it('should reject submission with title too long', () => {
      const submission = { ...validSubmission, title: 'a'.repeat(201) };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Title must be at most 200 characters'
      );
    });

    it('should reject submission with description too short', () => {
      const submission = { ...validSubmission, description: 'short' };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Description must be at least 10 characters'
      );
    });

    it('should reject submission with description too long', () => {
      const submission = { ...validSubmission, description: 'a'.repeat(5001) };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Description must be at most 5000 characters'
      );
    });

    it('should reject submission with negative budget', () => {
      const submission = { ...validSubmission, budgetMin: -100 };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Minimum budget must be non-negative'
      );
    });

    it('should reject submission where budgetMin > budgetMax', () => {
      const submission = { ...validSubmission, budgetMin: 6000, budgetMax: 5000 };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Minimum budget cannot exceed maximum budget'
      );
    });

    it('should reject submission with invalid email', () => {
      const submission = { ...validSubmission, contactEmail: 'invalid-email' };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Invalid email format'
      );
    });

    it('should reject submission with invalid phone', () => {
      const submission = {
        ...validSubmission,
        contactEmail: '',
        contactPhone: 'abc',
      };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Invalid phone number format'
      );
    });

    it('should reject submission with no images', () => {
      const submission = { ...validSubmission, imageIds: [] };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'At least one image is required'
      );
    });

    it('should reject submission with too many images', () => {
      const submission = {
        ...validSubmission,
        imageIds: Array(11).fill('img_123'),
      };
      expect(() => anonymousSubmissionSchema.parse(submission)).toThrow(
        'Maximum 10 images allowed'
      );
    });

    it('should accept various phone number formats', () => {
      const formats = [
        '+1234567890',
        '+1-234-567-8900',
        '123-456-7890',
        '+1 234 567 8900',
        '(123) 456-7890',
        '+1 (123) 456-7890',
        '1234567890',
      ];

      formats.forEach((phone) => {
        const submission = {
          ...validSubmission,
          contactEmail: '',
          contactPhone: phone,
        };
        expect(() => anonymousSubmissionSchema.parse(submission)).not.toThrow();
      });
    });
  });

  describe('submissionUpdateSchema', () => {
    it('should accept partial updates', () => {
      const update = { title: 'Updated Title' };
      const result = submissionUpdateSchema.parse(update);
      expect(result.title).toBe('Updated Title');
    });

    it('should accept empty object', () => {
      const result = submissionUpdateSchema.parse({});
      expect(result).toEqual({});
    });

    it('should validate budget relationship when both provided', () => {
      const update = { budgetMin: 6000, budgetMax: 5000 };
      expect(() => submissionUpdateSchema.parse(update)).toThrow(
        'Minimum budget cannot exceed maximum budget'
      );
    });

    it('should not validate budget relationship when only one provided', () => {
      const update1 = { budgetMin: 6000 };
      const update2 = { budgetMax: 5000 };
      expect(() => submissionUpdateSchema.parse(update1)).not.toThrow();
      expect(() => submissionUpdateSchema.parse(update2)).not.toThrow();
    });
  });

  describe('submissionApprovalSchema', () => {
    it('should accept empty object for approval without overrides', () => {
      const result = submissionApprovalSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept overrides', () => {
      const approval = {
        title: 'Approved Title',
        description: 'Approved description with enough characters',
        budgetMin: 2000,
        budgetMax: 8000,
      };
      const result = submissionApprovalSchema.parse(approval);
      expect(result.title).toBe('Approved Title');
    });

    it('should validate budget relationship', () => {
      const approval = { budgetMin: 6000, budgetMax: 5000 };
      expect(() => submissionApprovalSchema.parse(approval)).toThrow(
        'Minimum budget cannot exceed maximum budget'
      );
    });
  });

  describe('submissionRejectionSchema', () => {
    it('should accept rejection without reason', () => {
      const result = submissionRejectionSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept rejection with reason', () => {
      const rejection = { reason: 'Does not meet quality standards' };
      const result = submissionRejectionSchema.parse(rejection);
      expect(result.reason).toBe('Does not meet quality standards');
    });

    it('should reject reason that is too long', () => {
      const rejection = { reason: 'a'.repeat(1001) };
      expect(() => submissionRejectionSchema.parse(rejection)).toThrow(
        'Rejection reason must be at most 1000 characters'
      );
    });
  });

  describe('submissionFilterSchema', () => {
    it('should accept empty filter', () => {
      const result = submissionFilterSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should accept valid filters', () => {
      const filter = {
        page: 2,
        limit: 50,
        search: 'test',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-12-31T23:59:59Z',
        hasContact: true,
        flagged: false,
      };
      const result = submissionFilterSchema.parse(filter);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.search).toBe('test');
    });

    it('should reject invalid page number', () => {
      const filter = { page: 0 };
      expect(() => submissionFilterSchema.parse(filter)).toThrow(
        'Page must be a positive integer'
      );
    });

    it('should reject limit exceeding maximum', () => {
      const filter = { limit: 101 };
      expect(() => submissionFilterSchema.parse(filter)).toThrow(
        'Limit cannot exceed 100'
      );
    });

    it('should reject invalid date format', () => {
      const filter = { dateFrom: 'invalid-date' };
      expect(() => submissionFilterSchema.parse(filter)).toThrow(
        'Invalid date format'
      );
    });

    it('should reject search query that is too long', () => {
      const filter = { search: 'a'.repeat(201) };
      expect(() => submissionFilterSchema.parse(filter)).toThrow(
        'Search query must be at most 200 characters'
      );
    });
  });
});
