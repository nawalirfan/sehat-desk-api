import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { Patient } from '../types/patient';
import { PatientCreateInput, PatientQuery, PatientUpdateInput } from './patients.schema';

// A deleted patient should behave like one that never existed, everything here filters through this.
const ACTIVE_ONLY = 'deleted_at IS NULL';

@Injectable()
export class PatientsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database.Database) {}

  findById(patientId: string): Patient | undefined {
    return this.db
      .prepare(`SELECT * FROM patients WHERE patient_id = ? AND ${ACTIVE_ONLY}`)
      .get(patientId) as Patient | undefined;
  }

  // phone_number isn't unique, households can share a line, so this can silently match the wrong person if more than one exists.
  findByPhoneNumber(phoneNumber: string): Patient | undefined {
    return this.db
      .prepare(`SELECT * FROM patients WHERE phone_number = ? AND ${ACTIVE_ONLY}`)
      .get(phoneNumber) as Patient | undefined;
  }

  findAllByPhoneNumber(phoneNumber: string): Patient[] {
    return this.db
      .prepare(`SELECT * FROM patients WHERE phone_number = ? AND ${ACTIVE_ONLY} ORDER BY created_at ASC`)
      .all(phoneNumber) as Patient[];
  }

  list(query: PatientQuery): Patient[] {
    const conditions = [ACTIVE_ONLY];
    const params: string[] = [];

    if (query.last_name) {
      conditions.push('last_name = ?');
      params.push(query.last_name);
    }
    if (query.date_of_birth) {
      conditions.push('date_of_birth = ?');
      params.push(query.date_of_birth);
    }
    if (query.phone_number) {
      conditions.push('phone_number = ?');
      params.push(query.phone_number);
    }

    const sql = `SELECT * FROM patients WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
    return this.db.prepare(sql).all(...params) as Patient[];
  }

  insert(patientId: string, input: PatientCreateInput, timestamp: string): Patient {
    this.db
      .prepare(
        `INSERT INTO patients (
          patient_id, first_name, last_name, date_of_birth, sex, phone_number, email,
          address_line_1, address_line_2, city, state, zip_code,
          insurance_provider, insurance_member_id, preferred_language,
          emergency_contact_name, emergency_contact_phone, created_at, updated_at
        ) VALUES (
          @patient_id, @first_name, @last_name, @date_of_birth, @sex, @phone_number, @email,
          @address_line_1, @address_line_2, @city, @state, @zip_code,
          @insurance_provider, @insurance_member_id, @preferred_language,
          @emergency_contact_name, @emergency_contact_phone, @created_at, @updated_at
        )`,
      )
      .run({
        patient_id: patientId,
        email: null,
        address_line_2: null,
        insurance_provider: null,
        insurance_member_id: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        ...input,
        created_at: timestamp,
        updated_at: timestamp,
      });

    return this.findById(patientId)!;
  }

  update(patientId: string, input: PatientUpdateInput, timestamp: string): Patient | undefined {
    const existing = this.findById(patientId);
    if (!existing) {
      return undefined;
    }

    const fields = Object.keys(input) as (keyof PatientUpdateInput)[];
    if (fields.length === 0) {
      return existing;
    }

    const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
    this.db
      .prepare(`UPDATE patients SET ${setClause}, updated_at = @updated_at WHERE patient_id = @patient_id`)
      .run({ ...input, patient_id: patientId, updated_at: timestamp });

    return this.findById(patientId);
  }

  softDelete(patientId: string, timestamp: string): boolean {
    const result = this.db
      .prepare(`UPDATE patients SET deleted_at = ? WHERE patient_id = ? AND ${ACTIVE_ONLY}`)
      .run(timestamp, patientId);
    return result.changes > 0;
  }
}
