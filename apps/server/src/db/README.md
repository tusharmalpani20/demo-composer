# Database Migrations

This directory contains the database migration system using Umzug. Migrations allow you to version control your database schema and apply changes incrementally.

## Architecture

- **`create-db.ts`**: Creates the database if it doesn't already exist (connects to default `postgres` db)
- **`migrator.ts`**: Core migration engine that configures Umzug, parses SQL files, and manages migration state
- **`migrate.ts`**: CLI interface that provides commands to run migrations (supports targeted up/down)
- **`migrate-new.ts`**: CLI tool to generate new migration files with proper naming and templates
- **`migrations/`**: Directory containing sequential SQL migration files

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Ensure your database connection is configured in `.env-cmdrc` (the migration scripts load env vars via `env-cmd`)

3. Create the database (if it doesn't exist):
```bash
pnpm run db:create
```

4. Run all pending migrations:
```bash
pnpm run migrate:up
```

## Usage

### Create the database
```bash
pnpm run db:create
```
Connects to the default `postgres` database, checks if the target database exists, and creates it if not.

### Apply all pending migrations
```bash
pnpm run migrate:up
```
This will:
- Find all `.sql` files in `migrations/` directory
- Check which ones haven't been executed (via `schema_migrations` table)
- Execute them in order (by filename)
- Record each migration in `schema_migrations` table

### Apply migrations up to a specific file
```bash
pnpm run migrate:up 005_items.sql
```
This will:
- Apply only the pending migrations from the current state up to and including `005_items.sql`
- e.g. if 003, 004, 005 are pending, only 003, 004, and 005 will be applied

### Rollback the last migration
```bash
pnpm run migrate:down
```
This will:
- Find the last executed migration
- Run its DOWN section to reverse the changes
- Remove it from `schema_migrations` table

### Rollback down to a specific migration
```bash
pnpm run migrate:down 003_org_role.sql
```
This will:
- Rollback from the most recent executed migration down to and including `003_org_role.sql`
- e.g. if 001–005 are executed, migrations 005, 004, and 003 will be rolled back (in reverse order)

### Check migration status
```bash
pnpm run migrate:status
```
Shows:
- List of executed migrations
- List of pending migrations

### Create a new migration file
```bash
pnpm run migrate:new <migration_name>
```
Example:
```bash
pnpm run migrate:new user_creation
```
This will:
- Automatically determine the next sequential number
- Create a file like `002_user_creation.sql`
- Include a timestamp and UP/DOWN template

## Available Scripts

| Script | Description |
|---|---|
| `pnpm run db:create` | Create the database if it doesn't exist |
| `pnpm run migrate:up` | Apply all pending migrations |
| `pnpm run migrate:up <file>` | Apply pending migrations up to a specific file |
| `pnpm run migrate:down` | Rollback the last executed migration |
| `pnpm run migrate:down <file>` | Rollback down to a specific migration (inclusive) |
| `pnpm run migrate:status` | Show executed and pending migrations |
| `pnpm run migrate:new <name>` | Generate a new migration file |

## Creating New Migrations

### Option 1: Using the CLI tool (Recommended)

```bash
pnpm run migrate:new <migration_name>
```

Example:
```bash
pnpm run migrate:new add_user_table
```

This automatically:
- Creates a file with the next sequential number (e.g., `002_add_user_table.sql`)
- Adds a timestamp at the top
- Includes UP and DOWN section templates

### Option 2: Manual creation

1. Create a new file in `migrations/` directory with sequential numbering:
   - `001_initial_schema.sql`
   - `002_add_user_table.sql`
   - `003_add_indexes.sql`
   - etc.

2. Each migration file must have UP and DOWN sections:

```sql
-- UP:
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- DOWN:
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
```

3. Run migrations:
```bash
pnpm run migrate:up
```

## Migration File Format

### Structure
- **Sequential numbering**: Use `001_`, `002_`, `003_`, etc. (padded with zeros)
- **Descriptive names**: Use snake_case for clarity (e.g., `002_add_user_table.sql`)
- **UP section**: Contains SQL to apply the migration (forward changes)
- **DOWN section**: Contains SQL to rollback the migration (reverse changes)

### Section Markers
- `-- UP:` marks the beginning of the forward migration SQL
- `-- DOWN:` marks the beginning of the rollback SQL
- Both sections are required (DOWN can be empty if rollback is not possible)

### Example
```sql
-- UP:
ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';

-- DOWN:
ALTER TABLE users DROP COLUMN IF EXISTS status;
```

## How It Works

1. **Migration Tracking**: A `db_migration.schema_migrations` table is automatically created in the `db_migration` schema to track which migrations have been executed
2. **File Parsing**: Each `.sql` file is parsed to extract UP and DOWN sections
3. **Execution**: Migrations are executed in filename order (alphabetically by number)
4. **State Management**: Umzug ensures migrations are only run once and tracks execution order
5. **Schema Organization**: All migration-related tables are stored in the `db_migration` schema for better organization
6. **Targeted Migrations**: Both `up` and `down` accept an optional target filename to control exactly which migrations are applied or rolled back

## Important Notes

### ⚠️ Critical Rules

1. **Never edit existing migration files** that have been applied to production
   - If you need to change a migration, create a new one instead
   - Editing applied migrations breaks the migration history

2. **Always create new migrations** for schema changes
   - Each change should be a new numbered file
   - This maintains a clear history of database evolution

3. **Test UP and DOWN migrations** locally before deploying
   - Verify migrations work in both directions
   - Test rollback scenarios

4. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to debug and rollback if needed

5. **Order matters**
   - Migrations run in filename order
   - Use sequential numbering to ensure correct execution order

## Troubleshooting

### Database doesn't exist
```bash
pnpm run db:create
```

### Migration fails to run
- Check that your database connection is configured correctly in `.env-cmdrc`
- Verify the SQL syntax in your migration file
- Ensure UP and DOWN sections are properly marked

### Migration already executed error
- Check `schema_migrations` table to see what's been run
- If you need to re-run, manually remove the entry (use with caution!)

### Can't rollback
- Ensure DOWN section exists and is correct
- Check that the DOWN SQL properly reverses the UP changes

## Files Overview

- **`create-db.ts`**: Creates the target database if it doesn't exist
- **`migrator.ts`**: Configures Umzug, parses SQL files, manages migration state
- **`migrate.ts`**: CLI runner that executes migration commands (up/down/status with optional target)
- **`migrate-new.ts`**: CLI tool to generate new sequentially-numbered migration files
- **`migrations/*.sql`**: Individual migration files with UP/DOWN sections
- **`schema_migrations` table**: Database table tracking executed migrations (auto-created in `db_migration` schema)
