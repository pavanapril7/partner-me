import { z } from 'zod';

/**
 * User schema for validation
 * Demonstrates Zod schema definition with various validation rules
 */
export const UserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  age: z.number().int('Age must be an integer').min(0, 'Age must be non-negative').max(150, 'Age must be at most 150'),
  isActive: z.boolean().optional().default(true),
});

/**
 * Infer TypeScript type from Zod schema
 */
export type User = z.infer<typeof UserSchema>;

/**
 * Product schema for validation
 * Additional example schema with different validation rules
 */
export const ProductSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name is too long'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity cannot be negative'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(10, 'Too many tags'),
});

/**
 * Infer TypeScript type from Product schema
 */
export type Product = z.infer<typeof ProductSchema>;
