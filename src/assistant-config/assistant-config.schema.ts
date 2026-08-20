import { z } from 'zod';
import { isValidVoiceKey } from './voices';

export const assistantConfigUpdateSchema = z
  .object({
    greeting: z.string().trim().min(1).max(500),
    voice_id: z.string().refine(isValidVoiceKey, 'must be one of the available voice options'),
    max_call_duration_secs: z.coerce.number().int().min(60).max(1800),
    silence_timeout_secs: z.coerce.number().int().min(5).max(120),
    speaking_wait_secs: z.coerce.number().min(0.5).max(5),
    offer_appointments: z.boolean(),
    // null clears the override and falls back to the reviewed prompts/system-prompt.md file.
    system_prompt_override: z.string().trim().min(50).max(20_000).nullable(),
  })
  .partial();

export type AssistantConfigUpdateInput = z.infer<typeof assistantConfigUpdateSchema>;
