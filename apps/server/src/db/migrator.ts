/**
 * Database Migration Engine (migrator.ts)
 * 
 * This file configures Umzug, a database migration tool, to manage SQL-based migrations.
 * It handles:
 * - Finding and parsing migration SQL files
 * - Tracking which migrations have been executed
 * - Executing UP (forward) and DOWN (rollback) migrations
 */

import { Umzug, MigrationParams } from 'umzug';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.config';

// Get the directory path for ES modules (since we're using import.meta.url)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the migrations directory (db/migrations/)
const migrationsPath = path.join(__dirname, 'migrations');

/**
 * Ensures the db_migration schema and schema_migrations table exist in the database.
 * This table tracks which migrations have been executed.
 * 
 * Structure:
 * - Schema: db_migration (contains all migration-related tables)
 * - Table: schema_migrations
 *   - name: Migration filename (primary key)
 *   - executed_at: Timestamp when migration was run
 */
async function ensureMigrationsTable() {
  // Create the schema first
  await pool.query(`CREATE SCHEMA IF NOT EXISTS db_migration`);
  
  // Create the table in the schema
  await pool.query(`
    CREATE TABLE IF NOT EXISTS db_migration.schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Parses a migration SQL file to extract UP and DOWN sections.
 * 
 * Migration files should have this format:
 * -- UP:
 * [SQL statements to apply migration]
 * 
 * -- DOWN:
 * [SQL statements to rollback migration]
 * 
 * @param content - The full content of the migration SQL file
 * @returns Object with 'up' and 'down' SQL strings
 */
function parseMigrationFile(content: string) {
  // Match everything after "-- UP:" until "-- DOWN:" or end of file
  const upMatch = content.match(/-- UP:\s*([\s\S]*?)(?=-- DOWN:|$)/i);
  // Match everything after "-- DOWN:" until end of file
  const downMatch = content.match(/-- DOWN:\s*([\s\S]*?)$/is);

  return {
    up: upMatch?.[1]?.trim() ?? '',
    down: downMatch?.[1]?.trim() ?? '',
  };
}

/**
 * Storage adapter for Umzug.
 * This object tells Umzug how to interact with the database to track migrations.
 * 
 * Methods:
 * - executed(): Returns list of migration names that have been run
 * - logMigration(): Records a migration as executed
 * - unlogMigration(): Removes a migration from executed list (for rollback)
 */
const storage = {
  /**
   * Gets all executed migration names from the database.
   * @returns Array of migration filenames, ordered by execution time
   */
  async executed() {
    await ensureMigrationsTable();
    const result = await pool.query(
      'SELECT name FROM db_migration.schema_migrations ORDER BY executed_at'
    );
    return result.rows.map((r: { name: string }) => r.name);
  },
  
  /**
   * Records a migration as executed in the database.
   * @param name - The migration filename
   */
  async logMigration({ name }: { name: string }) {
    await ensureMigrationsTable();
    await pool.query(
      'INSERT INTO db_migration.schema_migrations (name, executed_at) VALUES ($1, NOW())',
      [name]
    );
  },
  
  /**
   * Removes a migration from the executed list (used during rollback).
   * @param name - The migration filename to remove
   */
  async unlogMigration({ name }: { name: string }) {
    await ensureMigrationsTable();
    await pool.query('DELETE FROM db_migration.schema_migrations WHERE name = $1', [name]);
  },
};

/**
 * Umzug instance - the core migration engine.
 * 
 * Configuration:
 * - migrations.glob: Pattern to find migration files (*.sql in migrations folder)
 * - migrations.resolve: Function that converts a migration file into executable functions
 * - context: Database pool passed to migrations (available but not used in our setup)
 * - storage: Our custom storage adapter for tracking migrations
 * - logger: Console logger for migration events
 */
export const umzug = new Umzug({
  migrations: {
    // Find all .sql files in the migrations directory
    glob: path.join(migrationsPath, '*.sql'),
    
    /**
     * Resolve function: Converts a migration file into executable migration functions.
     * 
     * This function is called for each migration file found by the glob pattern.
     * It returns an object with 'up' and 'down' functions that Umzug will execute.
     * 
     * @param params - Contains 'name' (filename) and 'path' (file path)
     * @returns Migration object with up/down functions
     */
    resolve: (params: MigrationParams<{ pool: typeof pool }>) => {
      const { name, path: migrationPath } = params;
      
      if (!migrationPath) {
        throw new Error(`Migration path not found for ${name}`);
      }

      return {
        name,
        
        /**
         * UP migration: Applies the migration forward.
         * This function is called when running migrations (migrate:up).
         */
        up: async () => {
          // Read the migration file
          const content = await fs.readFile(migrationPath, 'utf-8');
          // Parse to extract UP and DOWN sections
          const { up, down } = parseMigrationFile(content);

          if (!up) {
            throw new Error(`No UP section found in migration ${name}`);
          }

          // Execute the UP SQL
          await pool.query(up);
        },
        
        /**
         * DOWN migration: Rolls back the migration.
         * This function is called when rolling back (migrate:down).
         */
        down: async () => {
          // Read the migration file again (needed for rollback)
          const content = await fs.readFile(migrationPath, 'utf-8');
          const { up, down } = parseMigrationFile(content);

          if (!down) {
            console.warn(`No DOWN section found in ${name}, skipping rollback`);
            return;
          }

          // Execute the DOWN SQL
          await pool.query(down);
        },
      };
    },
  },
  context: { pool },
  storage,
  logger: console,
});

// Export the Migration type for TypeScript usage
export type Migration = typeof umzug._types.migration;
