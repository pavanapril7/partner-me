import {
  businessIdeaSchema,
  businessIdeaUpdateSchema,
  partnershipRequestSchema,
  partnershipRoleSchema,
  partnershipStatusSchema,
  partnershipStatusUpdateSchema,
} from '../src/schemas/business-idea.schema';

describe('Business Idea Schemas', () => {
  describe('businessIdeaSchema', () => {
    const validBusinessIdea = {
      title: 'Coffee Shop Franchise',
      description: '<p>A great coffee shop opportunity</p>',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      budgetMin: 50000,
      budgetMax: 100000,
    };

    it('should accept valid business idea', () => {
      expect(() => businessIdeaSchema.parse(validBusinessIdea)).not.toThrow();
    });

    it('should reject empty title', () => {
      const invalidData = { ...validBusinessIdea, title: '' };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('Title is required');
    });

    it('should reject empty description', () => {
      const invalidData = { ...validBusinessIdea, description: '' };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('Description is required');
    });

    it('should reject empty images array', () => {
      const invalidData = { ...validBusinessIdea, images: [] };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('At least one image is required');
    });

    it('should reject invalid image URLs', () => {
      const invalidData = { ...validBusinessIdea, images: ['not-a-url'] };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('Each image must be a valid URL');
    });

    it('should reject negative budgetMin', () => {
      const invalidData = { ...validBusinessIdea, budgetMin: -1000 };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('Minimum budget must be non-negative');
    });

    it('should reject negative budgetMax', () => {
      const invalidData = { ...validBusinessIdea, budgetMax: -5000 };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('Maximum budget must be non-negative');
    });

    it('should reject when budgetMin exceeds budgetMax', () => {
      const invalidData = { ...validBusinessIdea, budgetMin: 150000, budgetMax: 100000 };
      expect(() => businessIdeaSchema.parse(invalidData)).toThrow('Minimum budget cannot exceed maximum budget');
    });

    it('should accept when budgetMin equals budgetMax', () => {
      const validData = { ...validBusinessIdea, budgetMin: 100000, budgetMax: 100000 };
      expect(() => businessIdeaSchema.parse(validData)).not.toThrow();
    });

    it('should accept multiple images', () => {
      const validData = {
        ...validBusinessIdea,
        images: [
          'https://example.com/img1.jpg',
          'https://example.com/img2.jpg',
          'https://example.com/img3.jpg',
        ],
      };
      expect(() => businessIdeaSchema.parse(validData)).not.toThrow();
    });
  });

  describe('businessIdeaUpdateSchema', () => {
    it('should accept partial updates', () => {
      const partialUpdate = { title: 'Updated Title' };
      expect(() => businessIdeaUpdateSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should accept empty object for no updates', () => {
      expect(() => businessIdeaUpdateSchema.parse({})).not.toThrow();
    });

    it('should reject empty title if provided', () => {
      const invalidData = { title: '' };
      expect(() => businessIdeaUpdateSchema.parse(invalidData)).toThrow('Title cannot be empty');
    });

    it('should reject when budgetMin exceeds budgetMax if both provided', () => {
      const invalidData = { budgetMin: 150000, budgetMax: 100000 };
      expect(() => businessIdeaUpdateSchema.parse(invalidData)).toThrow('Minimum budget cannot exceed maximum budget');
    });

    it('should accept budgetMin alone without budgetMax', () => {
      const validData = { budgetMin: 50000 };
      expect(() => businessIdeaUpdateSchema.parse(validData)).not.toThrow();
    });

    it('should accept budgetMax alone without budgetMin', () => {
      const validData = { budgetMax: 100000 };
      expect(() => businessIdeaUpdateSchema.parse(validData)).not.toThrow();
    });
  });

  describe('partnershipRoleSchema', () => {
    it('should accept HELPER role', () => {
      expect(() => partnershipRoleSchema.parse('HELPER')).not.toThrow();
    });

    it('should accept OUTLET role', () => {
      expect(() => partnershipRoleSchema.parse('OUTLET')).not.toThrow();
    });

    it('should reject invalid role', () => {
      expect(() => partnershipRoleSchema.parse('INVALID')).toThrow();
    });
  });

  describe('partnershipRequestSchema', () => {
    const validRequest = {
      businessIdeaId: 'clx123abc456',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      role: 'HELPER' as const,
    };

    it('should accept valid partnership request', () => {
      expect(() => partnershipRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = { ...validRequest, name: '' };
      expect(() => partnershipRequestSchema.parse(invalidData)).toThrow('Name is required');
    });

    it('should reject empty phone number', () => {
      const invalidData = { ...validRequest, phoneNumber: '' };
      expect(() => partnershipRequestSchema.parse(invalidData)).toThrow('Phone number is required');
    });

    it('should reject missing role', () => {
      const invalidData = { ...validRequest, role: undefined };
      expect(() => partnershipRequestSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty business idea ID', () => {
      const invalidData = { ...validRequest, businessIdeaId: '' };
      expect(() => partnershipRequestSchema.parse(invalidData)).toThrow('Business idea ID is required');
    });

    // Phone number format tests
    it('should accept E.164 format phone number', () => {
      const validData = { ...validRequest, phoneNumber: '+12345678901' };
      expect(() => partnershipRequestSchema.parse(validData)).not.toThrow();
    });

    it('should accept phone number with dashes', () => {
      const validData = { ...validRequest, phoneNumber: '123-456-7890' };
      expect(() => partnershipRequestSchema.parse(validData)).not.toThrow();
    });

    it('should accept phone number with spaces', () => {
      const validData = { ...validRequest, phoneNumber: '+1 234 567 8900' };
      expect(() => partnershipRequestSchema.parse(validData)).not.toThrow();
    });

    it('should accept phone number with parentheses', () => {
      const validData = { ...validRequest, phoneNumber: '(123) 456-7890' };
      expect(() => partnershipRequestSchema.parse(validData)).not.toThrow();
    });

    it('should accept plain 10-digit phone number', () => {
      const validData = { ...validRequest, phoneNumber: '1234567890' };
      expect(() => partnershipRequestSchema.parse(validData)).not.toThrow();
    });

    it('should reject phone number with letters', () => {
      const invalidData = { ...validRequest, phoneNumber: '123-456-ABCD' };
      expect(() => partnershipRequestSchema.parse(invalidData)).toThrow('Phone number must be in a valid format');
    });

    it('should reject phone number with too few digits', () => {
      const invalidData = { ...validRequest, phoneNumber: '123' };
      expect(() => partnershipRequestSchema.parse(invalidData)).toThrow('Phone number must be in a valid format');
    });
  });

  describe('partnershipStatusSchema', () => {
    it('should accept PENDING status', () => {
      expect(() => partnershipStatusSchema.parse('PENDING')).not.toThrow();
    });

    it('should accept CONTACTED status', () => {
      expect(() => partnershipStatusSchema.parse('CONTACTED')).not.toThrow();
    });

    it('should accept ACCEPTED status', () => {
      expect(() => partnershipStatusSchema.parse('ACCEPTED')).not.toThrow();
    });

    it('should accept REJECTED status', () => {
      expect(() => partnershipStatusSchema.parse('REJECTED')).not.toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => partnershipStatusSchema.parse('INVALID')).toThrow();
    });
  });

  describe('partnershipStatusUpdateSchema', () => {
    it('should accept valid status update', () => {
      const validData = { status: 'CONTACTED' as const };
      expect(() => partnershipStatusUpdateSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid status', () => {
      const invalidData = { status: 'INVALID' };
      expect(() => partnershipStatusUpdateSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing status', () => {
      const invalidData = {};
      expect(() => partnershipStatusUpdateSchema.parse(invalidData)).toThrow();
    });
  });
});
