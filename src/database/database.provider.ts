import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { runMigrations } from '../../db/migrate';

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

export const databaseProvider: Provider = {
  provide: DATABASE_CONNECTION,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Database.Database => {
    const databasePath = configService.getOrThrow<string>('DATABASE_PATH');

    // CREATE TABLE IF NOT EXISTS makes this safe to run on every boot.
    runMigrations(databasePath);

    const db = new Database(databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    return db;
  },
};
