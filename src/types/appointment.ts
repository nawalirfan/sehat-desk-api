export interface Appointment {
  appointment_id: string;
  patient_id: string;
  scheduled_for: string;
  provider_name: string;
  reason: string | null;
  created_at: string;
}
