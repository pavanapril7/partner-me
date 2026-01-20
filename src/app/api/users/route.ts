import { NextRequest, NextResponse } from 'next/server';
import { UserSchema } from '@/schemas/user.schema';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users
 * Fetch all users from database
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      users,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users',
    }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Example API route demonstrating:
 * - Zod schema validation
 * - Prisma database operations
 * - Type-safe data handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body against UserSchema
    const validatedUser = UserSchema.parse(body);
    
    // Save to database using Prisma
    const user = await prisma.user.create({
      data: {
        email: validatedUser.email,
        name: validatedUser.name,
      },
    });
    
    // Return the created user
    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully',
    }, { status: 201 });
    
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        errors: error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }
    
    // Handle database errors (e.g., unique constraint violation)
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          success: false,
          message: 'A user with this email already exists',
        }, { status: 409 });
      }
    }
    
    // Handle other errors
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
