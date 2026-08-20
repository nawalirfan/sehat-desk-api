import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PatientsRepository } from './patients.repository';
import { PatientCreateInput, PatientQuery, PatientUpdateInput } from './patients.schema';
import { Patient } from '../types/patient';

// The REST controllers and the Vapi tool handlers both write patients through here, no separate path for either.
@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private readonly repository: PatientsRepository) {}

  list(query: PatientQuery): Patient[] {
    return this.repository.list(query);
  }

  getById(patientId: string): Patient {
    const patient = this.repository.findById(patientId);
    if (!patient) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Patient not found.' });
    }
    return patient;
  }

  // For transcript linking, a single best-guess match is fine there since there's no caller to ask.
  findActiveByPhone(phoneNumber: string): Patient | undefined {
    return this.repository.findByPhoneNumber(phoneNumber);
  }

  // For the duplicate-detection tool call, which needs every match so the assistant can ask which one is theirs.
  findAllActiveByPhone(phoneNumber: string): Patient[] {
    return this.repository.findAllByPhoneNumber(phoneNumber);
  }

  create(input: PatientCreateInput): Patient {
    const patientId = randomUUID();
    const timestamp = new Date().toISOString();
    const patient = this.repository.insert(patientId, input, timestamp);

    this.logger.log(
      `patient_intake_submitted patient_id=${patientId} phone=***${input.phone_number.slice(-4)}`,
    );

    return patient;
  }

  update(patientId: string, input: PatientUpdateInput): Patient {
    const timestamp = new Date().toISOString();
    const patient = this.repository.update(patientId, input, timestamp);
    if (!patient) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Patient not found.' });
    }
    return patient;
  }

  softDelete(patientId: string): { patient_id: string; deleted_at: string } {
    const timestamp = new Date().toISOString();
    const deleted = this.repository.softDelete(patientId, timestamp);
    if (!deleted) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Patient not found.' });
    }
    return { patient_id: patientId, deleted_at: timestamp };
  }
}
