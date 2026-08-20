import { Injectable, Logger } from '@nestjs/common';
import { AssistantConfigRepository } from './assistant-config.repository';
import { VapiAdminClient } from '../vapi/vapi-admin.client';
import { buildSystemPrompt } from './prompt-builder';
import { AssistantConfig } from '../types/assistant-config';
import { AssistantConfigUpdateInput } from './assistant-config.schema';
import { VOICE_OPTIONS } from './voices';

export interface AssistantConfigWithOptions {
  config: AssistantConfig;
  voiceOptions: typeof VOICE_OPTIONS;
}

@Injectable()
export class AssistantConfigService {
  private readonly logger = new Logger(AssistantConfigService.name);

  constructor(
    private readonly repository: AssistantConfigRepository,
    private readonly vapiAdminClient: VapiAdminClient,
  ) {}

  get(): AssistantConfigWithOptions {
    return { config: this.repository.get(), voiceOptions: VOICE_OPTIONS };
  }

  // The resolved default prompt, ignoring any override, current greeting and appointments
  // setting still apply. Lets the dashboard offer "reset to default" without duplicating
  // prompts/system-prompt.md client-side.
  getDefaultPrompt(): string {
    const current = this.repository.get();
    return buildSystemPrompt({ ...current, system_prompt_override: null });
  }

  async update(input: AssistantConfigUpdateInput): Promise<AssistantConfig> {
    const current = this.repository.get();
    const merged: AssistantConfig = {
      ...current,
      ...input,
      offer_appointments: input.offer_appointments !== undefined ? (input.offer_appointments ? 1 : 0) : current.offer_appointments,
    };

    const promptChanged =
      input.greeting !== undefined ||
      input.offer_appointments !== undefined ||
      input.system_prompt_override !== undefined;

    await this.vapiAdminClient.updateAssistant({
      systemPrompt: promptChanged ? buildSystemPrompt(merged) : undefined,
      firstMessage: input.greeting,
      voiceKey: input.voice_id,
      maxCallDurationSecs: input.max_call_duration_secs,
      silenceTimeoutSecs: input.silence_timeout_secs,
      speakingWaitSecs: input.speaking_wait_secs,
    });

    const timestamp = new Date().toISOString();
    const updated = this.repository.update(input, timestamp);
    this.logger.log(`assistant_config_updated fields=${Object.keys(input).join(',')}`);
    return updated;
  }
}
