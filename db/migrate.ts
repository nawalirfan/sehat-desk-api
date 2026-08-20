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

  db.close();
}

// Only fires on a direct run (npm run db:migrate), not when main.ts imports this on boot.
if (require.main === module) {
  const databasePath = resolveDatabasePath();
  runMigrations(databasePath);
  console.log(`Migrations applied to ${databasePath}`);
}
