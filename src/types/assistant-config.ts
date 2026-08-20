export interface AssistantConfig {
  id: 1;
  greeting: string;
  voice_id: string;
  max_call_duration_secs: number;
  silence_timeout_secs: number;
  speaking_wait_secs: number;
  offer_appointments: 0 | 1;
  system_prompt_override: string | null;
  updated_at: string;
}
