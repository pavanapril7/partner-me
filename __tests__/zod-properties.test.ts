import * as fc from 'fast-check';
import { UserSchema, ProductSchema } from '@/schemas/user.schema';

// Feature: nextjs-app-setup, Property 3: Zod schema rejects invalid data
// Validates: Requirements 5.2

describe('Zod Property Tests - Invalid Data Rejection', () => {
  // Property 3: Zod schema rejects invalid data
  // For any Zod schema and data that violates the schema constraints,
  // validation should fail and return error messages describing the violations
  
  describe('UserSchema invalid data rejection', () => {
    it('should reject invalid email addresses', () => {
      // Generate invalid email strings (strings without @ or proper format)
      const invalidEmailArbitrary = fc.oneof(
        fc.string().filter(s => !s.includes('@') && s.length > 0), // No @ symbol
        fc.string().filter(s => s.includes('@') && !s.includes('.')), // @ but no domain
        fc.constant('notanemail'), // No @ or domain
        fc.constant('@example.com'), // Missing local part
        fc.constant('user@'), // Missing domain
      );

      fc.assert(
        fc.property(
          invalidEmailArbitrary,
          fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2), // Valid name
          fc.integer({ min: 0, max: 150 }), // Valid age
          (email, name, age) => {
            const invalidData = { email, name, age };
            
            // Validation should fail due to invalid email
            const result = UserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have error messages
            if (!result.success) {
              expect(result.error).toBeDefined();
              expect(result.error.issues.length).toBeGreaterThan(0);
              
              // Should have an error for the email field
              const emailError = result.error.issues.find(err => err.path.includes('email'));
              expect(emailError).toBeDefined();
              expect(emailError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid name lengths', () => {
      // Generate names that are too short or too long
      const invalidNameArbitrary = fc.oneof(
        fc.string({ maxLength: 1 }), // Too short (< 2 chars)
        fc.string({ minLength: 101, maxLength: 200 }), // Too long (> 100 chars)
        fc.constant(''), // Empty
        fc.constant(' '), // Single space
      );

      fc.assert(
        fc.property(
          fc.emailAddress(), // Valid email
          invalidNameArbitrary,
          fc.integer({ min: 0, max: 150 }), // Valid age
          (email, name, age) => {
            const invalidData = { email, name, age };
            
            // Validation should fail due to invalid name
            const result = UserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have an error for the name field
            if (!result.success) {
              expect(result.error).toBeDefined();
              const nameError = result.error.issues.find(err => err.path.includes('name'));
              expect(nameError).toBeDefined();
              expect(nameError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid age values', () => {
      // Generate invalid ages (negative, too large, or non-integer)
      const invalidAgeArbitrary = fc.oneof(
        fc.integer({ max: -1 }), // Negative
        fc.integer({ min: 151, max: 1000 }), // Too large
        fc.double({ min: 0.1, max: 150.9, noNaN: true }).filter(n => !Number.isInteger(n)), // Non-integer
      );

      fc.assert(
        fc.property(
          fc.emailAddress(), // Valid email
          fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2), // Valid name
          invalidAgeArbitrary,
          (email, name, age) => {
            const invalidData = { email, name, age };
            
            // Validation should fail due to invalid age
            const result = UserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have an error for the age field
            if (!result.success) {
              expect(result.error).toBeDefined();
              const ageError = result.error.issues.find(err => err.path.includes('age'));
              expect(ageError).toBeDefined();
              expect(ageError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ProductSchema invalid data rejection', () => {
    it('should reject invalid UUID formats', () => {
      // Generate invalid UUIDs
      const invalidUuidArbitrary = fc.oneof(
        fc.string().filter(s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) && s.length > 0),
        fc.constant('not-a-uuid'),
        fc.string({ minLength: 1, maxLength: 20 }),
      );

      fc.assert(
        fc.property(
          invalidUuidArbitrary,
          fc.string({ minLength: 1, maxLength: 200 }), // Valid name
          fc.double({ min: 0.01, max: 10000, noNaN: true }), // Valid price
          fc.integer({ min: 0, max: 1000 }), // Valid quantity
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }), // Valid tags
          (id, name, price, quantity, tags) => {
            const invalidData = { id, name, price, quantity, tags };
            
            // Validation should fail due to invalid UUID
            const result = ProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have an error for the id field
            if (!result.success) {
              expect(result.error).toBeDefined();
              const idError = result.error.issues.find(err => err.path.includes('id'));
              expect(idError).toBeDefined();
              expect(idError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid price values', () => {
      // Generate invalid prices (zero, negative, or NaN)
      const invalidPriceArbitrary = fc.oneof(
        fc.constant(0),
        fc.double({ max: -0.01, noNaN: true }),
        fc.constant(-1),
        fc.constant(-100),
      );

      fc.assert(
        fc.property(
          fc.uuid(), // Valid UUID
          fc.string({ minLength: 1, maxLength: 200 }), // Valid name
          invalidPriceArbitrary,
          fc.integer({ min: 0, max: 1000 }), // Valid quantity
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }), // Valid tags
          (id, name, price, quantity, tags) => {
            const invalidData = { id, name, price, quantity, tags };
            
            // Validation should fail due to invalid price
            const result = ProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have an error for the price field
            if (!result.success) {
              expect(result.error).toBeDefined();
              const priceError = result.error.issues.find(err => err.path.includes('price'));
              expect(priceError).toBeDefined();
              expect(priceError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid quantity values', () => {
      // Generate invalid quantities (negative or non-integer)
      const invalidQuantityArbitrary = fc.oneof(
        fc.integer({ max: -1 }),
        fc.double({ min: 0.1, max: 100.9, noNaN: true }).filter(n => !Number.isInteger(n)),
      );

      fc.assert(
        fc.property(
          fc.uuid(), // Valid UUID
          fc.string({ minLength: 1, maxLength: 200 }), // Valid name
          fc.double({ min: 0.01, max: 10000, noNaN: true }), // Valid price
          invalidQuantityArbitrary,
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }), // Valid tags
          (id, name, price, quantity, tags) => {
            const invalidData = { id, name, price, quantity, tags };
            
            // Validation should fail due to invalid quantity
            const result = ProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have an error for the quantity field
            if (!result.success) {
              expect(result.error).toBeDefined();
              const quantityError = result.error.issues.find(err => err.path.includes('quantity'));
              expect(quantityError).toBeDefined();
              expect(quantityError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid tags arrays', () => {
      // Generate invalid tag arrays (empty or too many)
      const invalidTagsArbitrary = fc.oneof(
        fc.constant([]), // Empty array
        fc.array(fc.string(), { minLength: 11, maxLength: 20 }), // Too many tags
      );

      fc.assert(
        fc.property(
          fc.uuid(), // Valid UUID
          fc.string({ minLength: 1, maxLength: 200 }), // Valid name
          fc.double({ min: 0.01, max: 10000, noNaN: true }), // Valid price
          fc.integer({ min: 0, max: 1000 }), // Valid quantity
          invalidTagsArbitrary,
          (id, name, price, quantity, tags) => {
            const invalidData = { id, name, price, quantity, tags };
            
            // Validation should fail due to invalid tags
            const result = ProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            
            // Should have an error for the tags field
            if (!result.success) {
              expect(result.error).toBeDefined();
              const tagsError = result.error.issues.find(err => err.path.includes('tags'));
              expect(tagsError).toBeDefined();
              expect(tagsError?.message).toBeTruthy();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // General property: any schema should provide detailed error messages for violations
  it('should provide detailed error messages for all validation failures', () => {
    // Generate completely invalid data for UserSchema
    const invalidUserDataArbitrary = fc.record({
      email: fc.string().filter(s => !s.includes('@') && s.length > 0),
      name: fc.string({ maxLength: 1 }),
      age: fc.integer({ max: -1 }),
    });

    fc.assert(
      fc.property(invalidUserDataArbitrary, (invalidData) => {
        const result = UserSchema.safeParse(invalidData);
        
        // Should fail
        expect(result.success).toBe(false);
        
        // Should have multiple errors
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(result.error.issues.length).toBeGreaterThan(0);
          
          // Each error should have a path and message
          result.error.issues.forEach(error => {
            expect(error.path).toBeDefined();
            expect(error.message).toBeTruthy();
            expect(typeof error.message).toBe('string');
          });
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: nextjs-app-setup, Property 4: Zod schema accepts valid data
// Validates: Requirements 5.3

describe('Zod Property Tests - Valid Data Acceptance', () => {
  // Property 4: Zod schema accepts valid data
  // For any Zod schema and data that satisfies all schema constraints,
  // validation should succeed and return the parsed typed data
  
  describe('UserSchema valid data acceptance', () => {
    it('should accept valid user data', () => {
      // Generate valid user data with a simple email generator that matches Zod's validation
      const simpleEmailArbitrary = fc.tuple(
        fc.stringMatching(/^[a-z0-9]+$/),
        fc.stringMatching(/^[a-z0-9]+$/),
        fc.stringMatching(/^[a-z]{2,}$/)
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

      const validUserArbitrary = fc.record({
        email: simpleEmailArbitrary,
        name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
        age: fc.integer({ min: 0, max: 150 }),
        isActive: fc.option(fc.boolean(), { nil: undefined }),
      });

      fc.assert(
        fc.property(validUserArbitrary, (validData) => {
          const result = UserSchema.safeParse(validData);
          
          // Validation should succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Should return typed data
            expect(result.data).toBeDefined();
            expect(result.data.email).toBe(validData.email);
            expect(result.data.name).toBe(validData.name);
            expect(result.data.age).toBe(validData.age);
            
            // isActive should have a default value if not provided
            if (validData.isActive !== undefined) {
              expect(result.data.isActive).toBe(validData.isActive);
            } else {
              expect(result.data.isActive).toBe(true); // Default value
            }
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve data types after validation', () => {
      // Simple email generator
      const simpleEmailArbitrary = fc.tuple(
        fc.stringMatching(/^[a-z0-9]+$/),
        fc.stringMatching(/^[a-z0-9]+$/),
        fc.stringMatching(/^[a-z]{2,}$/)
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

      fc.assert(
        fc.property(
          simpleEmailArbitrary,
          fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          fc.integer({ min: 0, max: 150 }),
          (email, name, age) => {
            const validData = { email, name, age };
            const result = UserSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            
            if (result.success) {
              // Types should be preserved
              expect(typeof result.data.email).toBe('string');
              expect(typeof result.data.name).toBe('string');
              expect(typeof result.data.age).toBe('number');
              expect(typeof result.data.isActive).toBe('boolean');
              
              // Values should match input
              expect(result.data.email).toBe(email);
              expect(result.data.name).toBe(name);
              expect(result.data.age).toBe(age);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ProductSchema valid data acceptance', () => {
    it('should accept valid product data', () => {
      // Generate valid product data
      const validProductArbitrary = fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 200 }),
        price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        quantity: fc.integer({ min: 0, max: 1000 }),
        tags: fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
      });

      fc.assert(
        fc.property(validProductArbitrary, (validData) => {
          const result = ProductSchema.safeParse(validData);
          
          // Validation should succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Should return typed data
            expect(result.data).toBeDefined();
            expect(result.data.id).toBe(validData.id);
            expect(result.data.name).toBe(validData.name);
            expect(result.data.price).toBe(validData.price);
            expect(result.data.quantity).toBe(validData.quantity);
            expect(result.data.tags).toEqual(validData.tags);
          }
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve complex data structures after validation', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.integer({ min: 0, max: 1000 }),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          (id, name, price, quantity, tags) => {
            const validData = { id, name, price, quantity, tags };
            const result = ProductSchema.safeParse(validData);
            
            expect(result.success).toBe(true);
            
            if (result.success) {
              // Types should be preserved
              expect(typeof result.data.id).toBe('string');
              expect(typeof result.data.name).toBe('string');
              expect(typeof result.data.price).toBe('number');
              expect(typeof result.data.quantity).toBe('number');
              expect(Array.isArray(result.data.tags)).toBe(true);
              
              // Array contents should match
              expect(result.data.tags.length).toBe(tags.length);
              result.data.tags.forEach((tag, index) => {
                expect(tag).toBe(tags[index]);
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // General property: validation should be idempotent
  it('should produce the same result when validating the same data multiple times', () => {
    // Simple email generator
    const simpleEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.stringMatching(/^[a-z0-9]+$/),
      fc.stringMatching(/^[a-z]{2,}$/)
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    const validUserArbitrary = fc.record({
      email: simpleEmailArbitrary,
      name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
      age: fc.integer({ min: 0, max: 150 }),
    });

    fc.assert(
      fc.property(validUserArbitrary, (validData) => {
        const result1 = UserSchema.safeParse(validData);
        const result2 = UserSchema.safeParse(validData);
        
        // Both should succeed
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        
        if (result1.success && result2.success) {
          // Results should be identical
          expect(result1.data).toEqual(result2.data);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
