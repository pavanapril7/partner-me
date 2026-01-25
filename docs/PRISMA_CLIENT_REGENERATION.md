# Prisma Client Regeneration Fix

## Issue

After adding new models to the Prisma schema (like `AnonymousSubmission`), you may encounter this error:

```
TypeError: Cannot read properties of undefined (reading 'create')
at tx.anonymousSubmission.create
```

## Root Cause

The Prisma Client in memory doesn't have the new models because:
1. The schema was updated
2. Migrations were run
3. But the Prisma Client wasn't regenerated
4. Or the dev server is using a cached version

## Solution

### Step 1: Regenerate Prisma Client

```bash
npx prisma generate
```

This regenerates the Prisma Client with all the latest models from your schema.

### Step 2: Restart Your Dev Server

**Important**: You must restart your Next.js dev server for the changes to take effect.

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 3: Verify the Fix

Try your request again. The `anonymousSubmission` model should now be available.

## When to Regenerate Prisma Client

You need to regenerate the Prisma Client whenever you:
- ✅ Add new models to `schema.prisma`
- ✅ Modify existing models
- ✅ Add or remove fields
- ✅ Change relationships
- ✅ Run new migrations

## Quick Fix Command

```bash
# Regenerate and restart in one go
npx prisma generate && npm run dev
```

## Verification

After regenerating, you can verify the models are available:

```typescript
import { prisma } from '@/lib/prisma';

// These should all be available:
prisma.anonymousSubmission.create(...)
prisma.anonymousSubmissionImage.create(...)
prisma.submissionAuditLog.create(...)
```

## Related Commands

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Generate client + apply migrations
npx prisma migrate dev
```

## Troubleshooting

### Still Getting the Error?

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Reinstall Prisma Client**:
   ```bash
   npm install @prisma/client
   npx prisma generate
   ```

3. **Check your imports**:
   ```typescript
   // Make sure you're importing from the right place
   import { prisma } from '@/lib/prisma';
   ```

### TypeScript Errors?

If TypeScript doesn't recognize the new models:

```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) -> "TypeScript: Restart TS Server"
```

## Prevention

Add this to your workflow:
1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. This automatically generates the client
4. Restart your dev server

## Related Files

- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton
- `node_modules/@prisma/client` - Generated client
