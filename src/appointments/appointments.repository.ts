import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { Appointment } from '../types/appointment';

@Injectable()
export class AppointmentsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database.Database) {}

  listByPatient(patientId: string): Appointment[] {
    return this.db
      .prepare('SELECT * FROM appointments WHERE patient_id = ? ORDER BY scheduled_for ASC')
      .all(patientId) as Appointment[];
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number };
    return row.count;
  }

  insert(
    appointmentId: string,
    patientId: string,
    scheduledFor: string,
    providerName: string,
    reason: string | undefined,
    timestamp: string,
  ): Appointment {
    this.db
      .prepare(
        `INSERT INTO appointments (appointment_id, patient_id, scheduled_for, provider_name, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(appointmentId, patientId, scheduledFor, providerName, reason ?? null, timestamp);

    return this.db
      .prepare('SELECT * FROM appointments WHERE appointment_id = ?')
      .get(appointmentId) as Appointment;
  }
}
