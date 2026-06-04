/**
 * Migration File Generator (migrate-new.ts)
 * 
 * This script creates a new migration file with the proper naming convention
 * and template structure.
 * 
 * Usage: npm run migrate:new <migration_name>
 * Example: npm run migrate:new user_creation
 * 
 * This will create a file like: 002_user_creation.sql
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsPath = path.join(__dirname, 'migrations');

/**
 * Gets the next migration number by reading existing migration files.
 * @returns The next sequential number (e.g., 2 if 001 exists)
 */
async function getNextMigrationNumber(): Promise<number> {
  try {
    const files = await fs.readdir(migrationsPath);
    
    // Filter only .sql files that match the pattern: number_description.sql
    const migrationFiles = files.filter(file => 
      file.endsWith('.sql') && /^\d+_/.test(file)
    );
    
    if (migrationFiles.length === 0) {
      return 1;
    }
    
    // Extract numbers from filenames and find the maximum
    const numbers = migrationFiles.map(file => {
      const match = file.match(/^(\d+)_/);
      return match ? parseInt(match[1] || '0', 10) : 0;
    });
    
    const maxNumber = Math.max(...numbers);
    return maxNumber + 1;
  } catch (error) {
    // If directory doesn't exist or can't read, start with 1
    return 1;
  }
}

/**
 * Formats a number with leading zeros (e.g., 1 -> "001", 42 -> "042")
 */
function formatMigrationNumber(num: number): string {
  return num.toString().padStart(3, '0');
}

/**
 * Gets the current local time as a formatted string in DD-MM-YYYY HH:MM:SS format
 */
function getCurrentLocalTime(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Creates a new migration file with the template structure
 */
async function createMigrationFile(migrationName: string) {
  // Validate migration name
  if (!migrationName || migrationName.trim().length === 0) {
    throw new Error('Migration name is required');
  }
  
  // Sanitize migration name (only allow alphanumeric, underscore, and hyphen)
  const sanitizedName = migrationName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  
  if (sanitizedName.length === 0) {
    throw new Error('Migration name must contain at least one valid character');
  }
  
  // Get next migration number
  const nextNumber = await getNextMigrationNumber();
  const formattedNumber = formatMigrationNumber(nextNumber);
  
  // Create filename
  const filename = `${formattedNumber}_${sanitizedName}.sql`;
  const filePath = path.join(migrationsPath, filename);
  
  // Check if file already exists
  try {
    await fs.access(filePath);
    throw new Error(`Migration file ${filename} already exists`);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Get current local time
  const currentTime = getCurrentLocalTime();
  
  // Create file content with template
  // Format:
  // -- {filename} (commented)
  // -- Created On: {date} (commented)
  // empty line
  // -- UP:
  // empty lines for SQL
  // -- DOWN:
  const content = `-- ${filename}\n-- Created On: ${currentTime}\n\n-- UP:\n\n\n\n-- DOWN:\n`;
  
  // Ensure migrations directory exists
  try {
    await fs.mkdir(migrationsPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  // Write the file
  await fs.writeFile(filePath, content, 'utf-8');
  
  console.log(`✅ Created migration: ${filename}`);
  console.log(`   Path: ${filePath}`);
  
  return filePath;
}

// Main execution
async function main() {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.error('❌ Error: Migration name is required');
    console.log('\nUsage: npm run migrate:new <migration_name>');
    console.log('Example: npm run migrate:new user_creation');
    process.exit(1);
  }
  
  try {
    await createMigrationFile(migrationName);
  } catch (error: any) {
    console.error('❌ Error creating migration:', error.message);
    process.exit(1);
  }
}

main();
