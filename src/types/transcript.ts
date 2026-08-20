export interface CallTranscript {
  call_id: string;
  patient_id: string | null;
  transcript: string;
  summary: string | null;
  created_at: string;
}
