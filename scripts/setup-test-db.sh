#!/bin/bash

# Script to set up the test database
# This creates a separate database for tests to avoid polluting production data

echo "Setting up test database..."

# Create test database if it doesn't exist
psql -U pava5424 -d postgres -c "CREATE DATABASE \"partner-me-test\";" 2>/dev/null || echo "Test database already exists"

# Set the test database URL
export DATABASE_URL="postgresql://pava5424@localhost:5432/partner-me-test?schema=public"

# Run migrations on test database
echo "Running migrations on test database..."
npx prisma migrate deploy

echo "✅ Test database setup complete!"
echo "Tests will now use: partner-me-test database"
echo "Production database (partner-me) will remain untouched"
