import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppointmentsRepository } from './appointments.repository';
import { PatientsService } from '../patients/patients.service';
import { Appointment } from '../types/appointment';

// mock data
const SLOT_HOURS = [9, 10, 11, 12, 13, 14];

// Picked round robin by total appointment count, not a real roster.
const MOCK_PROVIDERS = ['Dr. Patel', 'Dr. Ahmed', 'Dr. Faisal', 'Dr. Khan', 'Dr. Reddy', 'Dr. Smith', 'Dr. Lee'];

function nextMockSlots(count: number): Date[] {
  const slots: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // start tomorrow, never offer a same-day slot

  while (slots.length < count) {
    const dayOfWeek = cursor.getDay();
    const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
    if (isWeekday) {
      for (const hour of SLOT_HOURS) {
        if (slots.length >= count) break;
        const slot = new Date(cursor);
        slot.setHours(hour, 0, 0, 0);
        slots.push(slot);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly patientsService: PatientsService,
  ) {}

  listByPatient(patientId: string): Appointment[] {
    this.patientsService.getById(patientId);
    return this.repository.listByPatient(patientId);
  }

  schedule(patientId: string, preferredTime?: string): Appointment {
    this.patientsService.getById(patientId);

    const candidates = nextMockSlots(5);
    const chosen = preferredTime ? this.closestTo(candidates, new Date(preferredTime)) : candidates[0];
    const providerName = MOCK_PROVIDERS[this.repository.count() % MOCK_PROVIDERS.length];

    const appointmentId = randomUUID();
    const timestamp = new Date().toISOString();
    return this.repository.insert(appointmentId, patientId, chosen.toISOString(), providerName, undefined, timestamp);
  }

  private closestTo(candidates: Date[], target: Date): Date {
    return candidates.reduce((closest, candidate) =>
      Math.abs(candidate.getTime() - target.getTime()) < Math.abs(closest.getTime() - target.getTime())
        ? candidate
        : closest,
    );
  }
}
