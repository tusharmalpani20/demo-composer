/**
 * Migration CLI Runner (migrate.ts)
 * 
 * Provides a command-line interface for managing database migrations via Umzug.
 * Env vars are loaded from `.env-cmdrc` via env-cmd (configured in package.json scripts).
 * 
 * Supported commands:
 *   up     [target]  — Apply all pending migrations, or up to a specific migration file.
 *   down   [target]  — Rollback the last executed migration, or rollback down to a specific migration file.
 *   status           — Display which migrations have been executed and which are still pending.
 * 
 * The optional [target] argument is the migration filename (e.g. "005_items.sql").
 *   - For `up`:   runs all pending migrations from the current state up to and including [target].
 *   - For `down`: rolls back all executed migrations from the most recent down to and including [target].
 *   - If [target] is omitted, `up` runs all pending and `down` rolls back only the last one.
 * 
 * Usage examples:
 *   pnpm run migrate:up                       # apply all pending migrations
 *   pnpm run migrate:up 005_items.sql         # apply pending migrations up to 005_items.sql
 *   pnpm run migrate:down                     # rollback the last migration
 *   pnpm run migrate:down 003_org_role.sql    # rollback down to 003_org_role.sql (inclusive)
 *   pnpm run migrate:status                   # show executed & pending migrations
 */

import { umzug } from './migrator';
import { pool } from '../config/database.config';

// process.argv: [node, script_path, command, target?]
const command = process.argv[2];
const target = process.argv[3];

async function run() {
  try {
    switch (command) {

      /**
       * UP — Apply pending migrations.
       * Without a target: applies ALL pending migrations in order.
       * With a target:    applies pending migrations up to and including the target file.
       *                   e.g. if 003, 004, 005 are pending and target is "004_foo.sql",
       *                   only 003 and 004 will be applied.
       */
      case 'up': {
        console.log('🔄 Running migrations...');

        const pending = await umzug.pending();

        if (pending.length === 0) {
          console.log('✅ No pending migrations');
          break;
        }

        if (target) {
          console.log(`📦 Running migrations up to: ${target}`);
          await umzug.up({ to: target });
        } else {
          console.log(`📦 Found ${pending.length} pending migration(s)`);
          await umzug.up();
        }

        console.log('✅ Migrations applied successfully');
        break;
      }

      /**
       * DOWN — Rollback executed migrations.
       * Without a target: rolls back only the LAST executed migration.
       * With a target:    rolls back from the most recent executed migration
       *                   down to and including the target file.
       *                   e.g. if 001–005 are executed and target is "003_bar.sql",
       *                   migrations 005, 004, and 003 will be rolled back (in reverse order).
       */
      case 'down': {
        console.log('🔄 Rolling back migration(s)...');

        const executed = await umzug.executed();

        if (executed.length === 0) {
          console.log('ℹ️  No migrations to rollback');
          break;
        }

        if (target) {
          console.log(`📦 Rolling back down to: ${target}`);
          await umzug.down({ to: target });
        } else {
          await umzug.down();
        }

        console.log('✅ Migration(s) rolled back successfully');
        break;
      }

      /**
       * STATUS — Show the current state of all migrations.
       * Lists every executed migration and every pending migration by filename.
       */
      case 'status': {
        const executed = await umzug.executed();
        const pending = await umzug.pending();

        console.log('\n📊 Migration Status:\n');

        console.log(`✅ Executed: ${executed.length}`);
        if (executed.length > 0) {
          executed.forEach((migration) => {
            console.log(`   - ${migration}`);
          });
        }

        console.log(`\n⏳ Pending: ${pending.length}`);
        if (pending.length > 0) {
          pending.forEach((migration) => {
            console.log(`   - ${migration.name}`);
          });
        }
        console.log('');
        break;
      }

      default:
        console.log(`
Usage: pnpm run migrate:<command> [target]

Commands:
  up      [target]  Apply pending migrations (optionally up to target)
  down    [target]  Rollback migrations (optionally down to target)
  status            Show migration status

Examples:
  pnpm run migrate:up                       # run all pending
  pnpm run migrate:up 005_items.sql         # run up to 005_items.sql
  pnpm run migrate:down                     # rollback last one
  pnpm run migrate:down 003_org_role.sql    # rollback down to 003_org_role.sql
  pnpm run migrate:status
        `);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    // Always close the database pool to avoid hanging connections
    await pool.end();
  }
}

run();
