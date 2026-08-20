import { Injectable, Logger } from '@nestjs/common';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { PatientsService } from '../patients/patients.service';

// Only the fields this handler actually reads, the real payload has a lot more (cost, ended-reason, etc).
interface VapiEndOfCallPayload {
  message: {
    call?: { id?: string; customer?: { number?: string } };
    transcript?: string;
    summary?: string;
  };
}

@Injectable()
export class EndOfCallHandlerService {
  private readonly logger = new Logger(EndOfCallHandlerService.name);

  constructor(
    private readonly transcriptsService: TranscriptsService,
    private readonly patientsService: PatientsService,
  ) {}

  async handle(body: unknown): Promise<void> {
    const payload = body as VapiEndOfCallPayload;
    const callId = payload.message?.call?.id;
    const transcript = payload.message?.transcript;

    if (!callId || !transcript) {
      this.logger.warn('end_of_call_report missing call id or transcript, skipping');
      return;
    }

    const patientId = this.resolvePatientId(payload);
    this.transcriptsService.record(callId, patientId, transcript, payload.message.summary ?? null);
    this.logger.log(`transcript_recorded call_id=${callId} patient_id=${patientId ?? 'unlinked'}`);
  }

  // Tool calls and the end-of-call report are separate Vapi events, so the patient_id doesn't carry over,
  // this re-derives it by matching the caller's number, and leaves it unlinked if nothing matches.
  private resolvePatientId(payload: VapiEndOfCallPayload): string | null {
    const rawNumber = payload.message.call?.customer?.number;
    if (!rawNumber) {
      this.logger.warn('end_of_call_report has no customer number, cannot link transcript');
      return null;
    }

    const phoneNumber = rawNumber.replace(/\D/g, '').slice(-10);
    const patient = this.patientsService.findActiveByPhone(phoneNumber);
    if (!patient) {
      this.logger.warn(`end_of_call_report customer number did not match any patient raw=${rawNumber} normalized=${phoneNumber}`);
    }
    return patient?.patient_id ?? null;
  }
}
