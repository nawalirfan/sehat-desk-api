import { Global, Module } from '@nestjs/common';
import { databaseProvider } from './database.provider';

// Global so any module can inject DATABASE_CONNECTION without importing this one directly.
@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule {}
