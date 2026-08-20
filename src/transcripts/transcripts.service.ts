import { Injectable } from '@nestjs/common';
import { TranscriptsRepository } from './transcripts.repository';
import { PatientsService } from '../patients/patients.service';
import { CallTranscript } from '../types/transcript';

@Injectable()
export class TranscriptsService {
  constructor(
    private readonly repository: TranscriptsRepository,
    private readonly patientsService: PatientsService,
  ) {}

  listByPatient(patientId: string): CallTranscript[] {
    this.patientsService.getById(patientId);
    return this.repository.listByPatient(patientId);
  }

  // patientId can be null, a caller can hang up before registration ever finishes, the transcript is still worth keeping.
  record(callId: string, patientId: string | null, transcript: string, summary: string | null): CallTranscript {
    const timestamp = new Date().toISOString();
    return this.repository.insert(callId, patientId, transcript, summary, timestamp);
  }
}
