import { Injectable, Logger } from '@nestjs/common';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { PatientsService } from '../patients/patients.service';
import { CallPatientLinkService } from './call-patient-link.service';

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
    private readonly callPatientLink: CallPatientLinkService,
  ) {}

  async handle(body: unknown): Promise<void> {
    const payload = body as VapiEndOfCallPayload;
    const callId = payload.message?.call?.id;
    const transcript = payload.message?.transcript;

    if (!callId || !transcript) {
      this.logger.warn('end_of_call_report missing call id or transcript, skipping');
      return;
    }

    const patientId = this.resolvePatientId(callId, payload);
    this.transcriptsService.record(callId, patientId, transcript, payload.message.summary ?? null);
    this.logger.log(`transcript_recorded call_id=${callId} patient_id=${patientId ?? 'unlinked'}`);
    this.callPatientLink.forget(callId);
  }

  // falls back to phone matching only if the tool-calls webhook never recorded a link for this call
  private resolvePatientId(callId: string, payload: VapiEndOfCallPayload): string | null {
    const linked = this.callPatientLink.resolve(callId);
    if (linked) {
      return linked;
    }

    const rawNumber = payload.message.call?.customer?.number;
    if (!rawNumber) {
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
