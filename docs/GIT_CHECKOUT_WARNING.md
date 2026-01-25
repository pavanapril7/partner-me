# ⚠️ WARNING: Don't Use `git checkout` on Prisma Schema

## What Happened

You ran:
```bash
git checkout prisma/schema.prisma
```

This **reverted the schema file** to an old version that doesn't include the anonymous submission models, even though:
- ✅ The migration files still exist in `prisma/migrations/`
- ✅ The database tables are already created
- ✅ All the code expects these models to exist

## The Problem

When you use `git checkout` on the schema file:
1. The schema file gets reverted to an older version
2. The Prisma Client no longer knows about the new models
3. Your code tries to use `prisma.anonymousSubmission.create()` but it doesn't exist
4. You get: `TypeError: Cannot read properties of undefined (reading 'create')`

## Why This Is Dangerous

- **Schema and migrations are out of sync**: The database has tables that the schema doesn't know about
- **Code breaks**: All code using the new models will fail
- **Data loss risk**: If you run migrations again, you might lose data

## What NOT To Do

❌ **NEVER** run these commands on `prisma/schema.prisma`:
```bash
git checkout prisma/schema.prisma
git reset prisma/schema.prisma
git restore prisma/schema.prisma
```

## What To Do Instead

### If You Want to Undo Schema Changes

1. **Before making changes**, create a new migration:
   ```bash
   # This is the safe way to revert
   npx prisma migrate dev --name revert_changes
   ```

2. **If you need to undo a migration**:
   ```bash
   # Revert the last migration
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

### If You Already Ran `git checkout` (Like You Did)

1. **Check what migrations exist**:
   ```bash
   ls prisma/migrations/
   ```

2. **Look at the latest migration** to see what models should be in the schema:
   ```bash
   cat prisma/migrations/*/migration.sql | grep "CREATE TABLE"
   ```

3. **Restore the schema** by either:
   - Pulling from the correct git commit
   - Manually adding the models back (like I just did)
   - Using `git reflog` to find the commit before checkout

4. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Restart your dev server**:
   ```bash
   npm run dev
   ```

## How to Safely Work with Prisma Schema

### Making Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create a migration
npx prisma migrate dev --name your_change_description

# This automatically:
# - Creates the migration file
# - Applies it to the database
# - Regenerates the Prisma Client
```

### Reverting Changes

```bash
# Option 1: Reset database (development only!)
npx prisma migrate reset

# Option 2: Create a new migration that undoes changes
# Edit schema.prisma to remove the changes
npx prisma migrate dev --name revert_feature_name
```

### Checking Status

```bash
# See if schema and database are in sync
npx prisma migrate status

# Validate schema syntax
npx prisma validate

# See what's in the database
npx prisma studio
```

## The Correct Workflow

```bash
# ✅ CORRECT: Make changes through migrations
1. Edit prisma/schema.prisma
2. npx prisma migrate dev --name add_feature
3. Commit both schema.prisma AND the migration files
4. Push to git

# ❌ WRONG: Revert schema without handling migrations
1. git checkout prisma/schema.prisma  # DON'T DO THIS!
```

## What I Fixed

I restored your schema by:
1. ✅ Reading the migration file to see what models were created
2. ✅ Adding the missing models back to `prisma/schema.prisma`:
   - `AnonymousSubmission`
   - `AnonymousSubmissionImage`
   - `SubmissionAuditLog`
   - `SubmissionStatus` enum
   - `SubmissionAction` enum
3. ✅ Adding the missing relations to existing models:
   - `User` → `approvedSubmissions`, `rejectedSubmissions`, `submissionAuditLogs`
   - `BusinessIdea` → `anonymousSubmission`
   - `Image` → `anonymousSubmissionImage`
4. ✅ Regenerated the Prisma Client: `npx prisma generate`

## Prevention

**Golden Rule**: Never use `git checkout` on files that are generated or have dependencies:
- ❌ `prisma/schema.prisma` (has migration dependencies)
- ❌ `package-lock.json` (has node_modules dependencies)
- ❌ Generated files in `.next/`, `dist/`, etc.

Instead:
- ✅ Use proper migration commands
- ✅ Commit schema and migrations together
- ✅ Use `npx prisma migrate reset` for clean slate (dev only)

## Summary

**Remember**: The Prisma schema and migrations must stay in sync. Always use Prisma's migration commands to make changes, never manually revert the schema file with git commands.

## Related Documentation

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- `docs/PRISMA_CLIENT_REGENERATION.md` - How to regenerate the client
- `docs/ANONYMOUS_SUBMISSION_TROUBLESHOOTING.md` - Troubleshooting guide
