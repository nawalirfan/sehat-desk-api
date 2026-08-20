import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { CallTranscript } from '../types/transcript';

@Injectable()
export class TranscriptsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database.Database) {}

  listByPatient(patientId: string): CallTranscript[] {
    return this.db
      .prepare('SELECT * FROM call_transcripts WHERE patient_id = ? ORDER BY created_at DESC')
      .all(patientId) as CallTranscript[];
  }

  insert(
    callId: string,
    patientId: string | null,
    transcript: string,
    summary: string | null,
    timestamp: string,
  ): CallTranscript {
    // Upsert in case Vapi redelivers the same end-of-call event twice.
    this.db
      .prepare(
        `INSERT INTO call_transcripts (call_id, patient_id, transcript, summary, created_at)
         VALUES (@call_id, @patient_id, @transcript, @summary, @created_at)
         ON CONFLICT(call_id) DO UPDATE SET
           patient_id = excluded.patient_id,
           transcript = excluded.transcript,
           summary = excluded.summary`,
      )
      .run({ call_id: callId, patient_id: patientId, transcript, summary, created_at: timestamp });

    return this.db.prepare('SELECT * FROM call_transcripts WHERE call_id = ?').get(callId) as CallTranscript;
  }
}
