# Project Guidelines

## Database Workflow

**NEVER modify the remote DB directly.** All database changes must go through local migration files and be pushed to remote.

### Change Process

1. Create a new migration file: `npx supabase migration new <migration_name>`
2. Write SQL in the generated file under `supabase/migrations/`
3. Test locally if needed: `npx supabase db reset`
4. Push to remote: `npx supabase db push`
5. Validate sync: `npx supabase db push --dry-run` (should return "No pending migrations")

### What Requires a Migration File

- Create/alter/drop tables
- Add/modify/remove RLS policies
- Create/modify/remove functions and triggers
- Insert/update seed data
- Change indexes and constraints

### Rules

- Do not use Supabase Dashboard SQL Editor to modify schema/policies on production
- Do not use MCP `execute_sql` for DDL on remote (read-only queries and debugging only)
- Every change must have a migration file to ensure local-remote sync
