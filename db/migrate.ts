import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';

// Same resolution the app's DatabaseModule uses, so a manual db:migrate run targets the same file.
export function resolveDatabasePath(): string {
  return process.env.DATABASE_PATH ?? './data/sehatdesk.db';
}

export function runMigrations(databasePath: string): void {
  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = join(dirname(__filename), 'init.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  addColumnIfMissing(db, 'assistant_config', 'speaking_wait_secs', 'REAL NOT NULL DEFAULT 2');

  db.close();
}

// CREATE TABLE IF NOT EXISTS in init.sql only handles brand new databases, an existing
// table doesn't pick up columns added to the schema later without this.
function addColumnIfMissing(db: Database.Database, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Only fires on a direct run (npm run db:migrate), not when main.ts imports this on boot.
if (require.main === module) {
  const databasePath = resolveDatabasePath();
  runMigrations(databasePath);
  console.log(`Migrations applied to ${databasePath}`);
}
