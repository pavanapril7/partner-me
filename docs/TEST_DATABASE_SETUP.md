# Test Database Setup

## Problem
Tests were inserting data into the production database (`partner-me`), causing:
- Test data pollution in production
- Potential data conflicts
- Difficulty in cleaning up test data

## Solution
We now use a **separate test database** (`partner-me-test`) that is automatically:
1. Created when you run the setup script
2. Used by all tests via Jest configuration
3. Cleaned after each test to ensure isolation

## How It Works

### 1. Separate Database
- **Production DB**: `partner-me` (used by your app)
- **Test DB**: `partner-me-test` (used by tests only)

### 2. Automatic Switching
The `jest.setup.js` file automatically switches to the test database:
```javascript
process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
  '/partner-me?',
  '/partner-me-test?'
);
```

### 3. Automatic Cleanup
After each test, all data is deleted from the test database:
```javascript
afterEach(async () => {
  // Clean up all test data in reverse order of dependencies
  await prisma.submissionAuditLog.deleteMany({});
  await prisma.anonymousSubmissionImage.deleteMany({});
  await prisma.anonymousSubmission.deleteMany({});
  // ... etc
});
```

## Setup Instructions

### First Time Setup
Run the setup script to create the test database:
```bash
./scripts/setup-test-db.sh
```

This will:
1. Create the `partner-me-test` database
2. Run all migrations on the test database
3. Prepare it for testing

### Running Tests
Just run tests normally - they'll automatically use the test database:
```bash
npm test
```

### Verifying Test Database
Check which database tests are using:
```bash
# Connect to test database
psql -U pava5424 -d partner-me-test

# List tables
\dt

# Check if there's any data (should be empty after tests)
SELECT COUNT(*) FROM business_ideas;
SELECT COUNT(*) FROM anonymous_submissions;
```

### Manually Clean Test Database
If needed, you can manually clean the test database:
```bash
psql -U pava5424 -d partner-me-test -c "
  TRUNCATE TABLE submission_audit_logs CASCADE;
  TRUNCATE TABLE anonymous_submission_images CASCADE;
  TRUNCATE TABLE anonymous_submissions CASCADE;
  TRUNCATE TABLE image_variants CASCADE;
  TRUNCATE TABLE images CASCADE;
  TRUNCATE TABLE partnership_requests CASCADE;
  TRUNCATE TABLE business_ideas CASCADE;
  TRUNCATE TABLE login_attempts CASCADE;
  TRUNCATE TABLE otps CASCADE;
  TRUNCATE TABLE sessions CASCADE;
  TRUNCATE TABLE users CASCADE;
"
```

### Reset Test Database
To completely reset the test database:
```bash
# Drop and recreate
psql -U pava5424 -d postgres -c "DROP DATABASE IF EXISTS \"partner-me-test\";"
./scripts/setup-test-db.sh
```

## Benefits

### ✅ Data Isolation
- Production data is never touched by tests
- Each test starts with a clean database
- No test data pollution

### ✅ Test Independence
- Tests don't interfere with each other
- Automatic cleanup after each test
- Predictable test behavior

### ✅ Safe Testing
- Can run tests anytime without worry
- No need to manually clean up test data
- Production database stays pristine

## Files Modified

1. **jest.setup.js** - Switches to test database and adds cleanup
2. **scripts/setup-test-db.sh** - Creates and migrates test database
3. **docs/TEST_DATABASE_SETUP.md** - This documentation

## Troubleshooting

### Tests Still Using Production Database
If tests are still using the production database:
1. Check that `jest.setup.js` is being loaded
2. Verify the database URL replacement logic
3. Check Jest config has `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']`

### Test Database Doesn't Exist
Run the setup script:
```bash
./scripts/setup-test-db.sh
```

### Migrations Out of Sync
If the test database schema is out of sync:
```bash
export DATABASE_URL="postgresql://pava5424@localhost:5432/partner-me-test?schema=public"
npx prisma migrate deploy
```

### Permission Issues
If you get permission errors:
```bash
# Grant permissions
psql -U pava5424 -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"partner-me-test\" TO pava5424;"
```

## Production Database Protection

Your production database (`partner-me`) is now protected:
- ✅ Tests never write to it
- ✅ Test data doesn't pollute it
- ✅ You can run tests anytime safely

The test database (`partner-me-test`) is:
- ✅ Automatically cleaned after each test
- ✅ Completely separate from production
- ✅ Safe to reset or drop anytime
