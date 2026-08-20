import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveProviderVoiceId } from '../assistant-config/voices';

interface AssistantUpdatePayload {
  // Assembled by AssistantConfigService's buildSystemPrompt(), set whenever greeting or offer_appointments changes.
  systemPrompt?: string;
  // Vapi speaks this on connect, before the model even sees the system prompt, has to move in lockstep with greeting changes.
  firstMessage?: string;
  voiceKey?: string;
  maxCallDurationSecs?: number;
  silenceTimeoutSecs?: number;
  // How long Vapi waits after detecting the caller has stopped talking before letting the model respond
  speakingWaitSecs?: number;
}

// The one place this app calls out to Vapi's API 
@Injectable()
export class VapiAdminClient {
  private readonly logger = new Logger(VapiAdminClient.name);
  private readonly baseUrl = 'https://api.vapi.ai';

  constructor(private readonly configService: ConfigService) {}

  async updateAssistant(payload: AssistantUpdatePayload): Promise<void> {
    const apiKey = this.configService.getOrThrow<string>('VAPI_API_KEY');
    const assistantId = this.configService.getOrThrow<string>('VAPI_ASSISTANT_ID');
    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    // vapi expects whole payload, fetching the previously saved assistant config to merge in any unchanged fields. 
    const needsCurrentState =
      payload.systemPrompt !== undefined || payload.voiceKey !== undefined || payload.speakingWaitSecs !== undefined;
    const current = needsCurrentState ? await this.fetchAssistant(assistantId, headers) : null;

    const body: Record<string, unknown> = {};

    if (payload.systemPrompt !== undefined && current) {
      const currentModel = (current.model as Record<string, unknown>) ?? {};
      const currentMessages = Array.isArray(currentModel.messages) ? currentModel.messages : [];
      const otherMessages = currentMessages.filter(
        (message) => (message as { role?: string }).role !== 'system',
      );
      body.model = {
        ...currentModel,
        messages: [{ role: 'system', content: payload.systemPrompt }, ...otherMessages],
      };
    }
    if (payload.firstMessage !== undefined) {
      body.firstMessage = payload.firstMessage;
    }
    if (payload.voiceKey && current) {
      const currentVoice = (current.voice as Record<string, unknown>) ?? {};
      body.voice = {
        ...currentVoice,
        provider: '11labs',
        voiceId: resolveProviderVoiceId(payload.voiceKey),
      };
    }
    if (payload.maxCallDurationSecs !== undefined) {
      body.maxDurationSeconds = payload.maxCallDurationSecs;
    }
    if (payload.silenceTimeoutSecs !== undefined) {
      body.silenceTimeoutSeconds = payload.silenceTimeoutSecs;
    }
    if (payload.speakingWaitSecs !== undefined && current) {
      const currentPlan = (current.startSpeakingPlan as Record<string, unknown>) ?? {};
      body.startSpeakingPlan = { ...currentPlan, waitSeconds: payload.speakingWaitSecs };
    }

    const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`vapi_update_assistant_failed status=${response.status} body=${errorText}`);
      throw new InternalServerErrorException({
        code: 'VAPI_UPDATE_FAILED',
        message: 'Could not update the live assistant configuration. No changes were saved.',
      });
    }
  }

  private async fetchAssistant(
    assistantId: string,
    headers: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`vapi_fetch_assistant_failed status=${response.status} body=${errorText}`);
      throw new InternalServerErrorException({
        code: 'VAPI_UPDATE_FAILED',
        message: 'Could not read the live assistant configuration. No changes were saved.',
      });
    }
    return response.json();
  }
}
