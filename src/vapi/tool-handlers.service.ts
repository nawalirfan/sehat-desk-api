import { Injectable, Logger } from '@nestjs/common';
import { ZodError } from 'zod';
import { PatientsService } from '../patients/patients.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { CallPatientLinkService } from './call-patient-link.service';
import { patientCreateSchema, patientUpdateSchema } from '../patients/patients.schema';

export interface VapiToolCall {
  id: string;
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface ToolCallResult {
  toolCallId: string;
  result: unknown;
}

// Calls the same PatientsService/AppointmentsService methods the REST controllers use, no separate write path.
@Injectable()
export class ToolHandlersService {
  private readonly logger = new Logger(ToolHandlersService.name);

  constructor(
    private readonly patientsService: PatientsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly callPatientLink: CallPatientLinkService,
  ) {}

  async handle(toolCalls: VapiToolCall[], callId?: string): Promise<ToolCallResult[]> {
    return Promise.all(toolCalls.map((call) => this.handleOne(call, callId)));
  }

  private async handleOne(call: VapiToolCall, callId?: string): Promise<ToolCallResult> {
    this.logger.log(`vapi_tool_call name=${call.function.name}`);

    try {
      switch (call.function.name) {
        case 'lookup_patient_by_phone':
          return { toolCallId: call.id, result: this.lookupPatientByPhone(call.function.arguments) };
        case 'create_or_update_patient':
          return { toolCallId: call.id, result: this.createOrUpdatePatient(call.function.arguments, callId) };
        case 'schedule_appointment':
          return { toolCallId: call.id, result: this.scheduleAppointment(call.function.arguments) };
        default:
          return {
            toolCallId: call.id,
            result: { success: false, error: `Unknown tool: ${call.function.name}` },
          };
      }
    } catch (error) {
      // A failure has to come back as a result the model can read out loud, never a thrown error that just hangs the call.
      this.logger.error(`vapi_tool_call_failed name=${call.function.name}`, error instanceof Error ? error.stack : error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { toolCallId: call.id, result: { success: false, error: message } };
    }
  }

  private lookupPatientByPhone(args: Record<string, unknown>) {
    const digitsOnly = String(args.phone_number ?? '').replace(/\D/g, '');

    // Checked here, not just at save time, because the model can't reliably count digits in something it just heard spoken.
    if (digitsOnly.length !== 10) {
      return {
        found: false,
        error: `That phone number has ${digitsOnly.length} digits, not 10. Ask the caller for their number again.`,
      };
    }

    // Not unique, a shared family line can return more than one patient here.
    const matches = this.patientsService.findAllActiveByPhone(digitsOnly);

    if (matches.length === 0) {
      return { found: false };
    }

    return {
      found: true,
      // Full record, not just the name, so a returning caller can be read their info back instead of re-asked everything.
      matches: matches.map((patient) => ({
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        sex: patient.sex,
        phone_number: patient.phone_number,
        email: patient.email,
        address_line_1: patient.address_line_1,
        address_line_2: patient.address_line_2,
        city: patient.city,
        state: patient.state,
        zip_code: patient.zip_code,
        insurance_provider: patient.insurance_provider,
        insurance_member_id: patient.insurance_member_id,
        preferred_language: patient.preferred_language,
        emergency_contact_name: patient.emergency_contact_name,
        emergency_contact_phone: patient.emergency_contact_phone,
      })),
    };
  }

  private createOrUpdatePatient(args: Record<string, unknown>, callId?: string) {
    const { patient_id, ...payload } = args as { patient_id?: string } & Record<string, unknown>;

    if (patient_id) {
      const result = patientUpdateSchema.safeParse(payload);
      if (!result.success) {
        return { success: false, error: this.describeValidationError(result.error) };
      }
      const patient = this.patientsService.update(patient_id, result.data);
      if (callId) this.callPatientLink.remember(callId, patient.patient_id);
      return { success: true, patient_id: patient.patient_id };
    }

    const result = patientCreateSchema.safeParse(payload);
    if (!result.success) {
      return { success: false, error: this.describeValidationError(result.error) };
    }
    const patient = this.patientsService.create(result.data);
    if (callId) this.callPatientLink.remember(callId, patient.patient_id);
    return { success: true, patient_id: patient.patient_id };
  }

  private describeValidationError(error: ZodError): string {
    const fieldErrors = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    return `Invalid patient data: ${fieldErrors}`;
  }

  private scheduleAppointment(args: Record<string, unknown>) {
    const patientId = String(args.patient_id ?? '');
    const preferredTime = args.preferred_time ? String(args.preferred_time) : undefined;
    const appointment = this.appointmentsService.schedule(patientId, preferredTime);
    return {
      success: true,
      scheduled_for: appointment.scheduled_for,
      provider_name: appointment.provider_name,
    };
  }
}
