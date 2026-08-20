import { Injectable } from '@nestjs/common';

// links a call's confirmed patient to its later end-of-call report, since caller ID can't be trusted for this
@Injectable()
export class CallPatientLinkService {
  private readonly patientIdByCallId = new Map<string, string>();

  remember(callId: string, patientId: string): void {
    this.patientIdByCallId.set(callId, patientId);
  }

  resolve(callId: string): string | undefined {
    return this.patientIdByCallId.get(callId);
  }

  forget(callId: string): void {
    this.patientIdByCallId.delete(callId);
  }
}
