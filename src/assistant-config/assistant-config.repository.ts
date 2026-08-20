import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { AssistantConfig } from '../types/assistant-config';
import { AssistantConfigUpdateInput } from './assistant-config.schema';

@Injectable()
export class AssistantConfigRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database.Database) {}

  get(): AssistantConfig {
    return this.db.prepare('SELECT * FROM assistant_config WHERE id = 1').get() as AssistantConfig;
  }

  update(input: AssistantConfigUpdateInput, timestamp: string): AssistantConfig {
    const fields = Object.keys(input) as (keyof AssistantConfigUpdateInput)[];
    if (fields.length === 0) {
      return this.get();
    }
   
    const params: Record<string, unknown> = { ...input, updated_at: timestamp };
    if ('offer_appointments' in params) {
      params.offer_appointments = params.offer_appointments ? 1 : 0;
    }

    const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
    this.db.prepare(`UPDATE assistant_config SET ${setClause}, updated_at = @updated_at WHERE id = 1`).run(params);

    return this.get();
  }
}
