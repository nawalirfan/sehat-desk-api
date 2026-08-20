import { readFileSync } from 'fs';
import { join } from 'path';
import { AssistantConfig } from '../types/assistant-config';

// Fills in two markers from system-prompt.md: {{greeting}} gets swapped for the actual text, and the
// {{#offer_appointments}}...{{/offer_appointments}} block gets kept or stripped depending on the setting.
// The prompt also references Vapi's own {{now}} variable directly, that one resolves fresh on
// Vapi's side at call time rather than when this function runs, so it's left untouched here,
// baking "today" in at save time would go stale the moment nobody touches settings for a day.
//
// If system_prompt_override is set, it replaces the reviewed file entirely, used as-is with no
// substitution, whoever wrote the override is responsible for it being complete and self-contained.
export function buildSystemPrompt(config: AssistantConfig): string {
  if (config.system_prompt_override) {
    return config.system_prompt_override.trim();
  }

  const templatePath = join(__dirname, '..', '..', 'prompts', 'system-prompt.md');
  const template = readFileSync(templatePath, 'utf-8');

  let prompt = template.replaceAll('{{greeting}}', config.greeting);

  const appointmentSectionPattern = /{{#offer_appointments}}([\s\S]*?){{\/offer_appointments}}/g;
  prompt = prompt.replace(appointmentSectionPattern, (_match, section: string) =>
    config.offer_appointments ? section : '',
  );

  return prompt.trim();
}
