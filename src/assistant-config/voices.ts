export interface VoiceOption {
  key: string;
  label: string;
  provider: 'elevenlabs';
  providerVoiceId: string;
  recommended?: boolean;
}

// providerVoiceId values are Vapi's own named 11labs presets, not raw ElevenLabs voice IDs,
// Vapi resolves these server-side so there's nothing extra to configure on our end.
export const VOICE_OPTIONS: VoiceOption[] = [
  { key: 'elliot', label: 'Elliot, calm and professional (default)', provider: 'elevenlabs', providerVoiceId: 'elliot', recommended: true },
  { key: 'sarah', label: 'Sarah, warm and reassuring', provider: 'elevenlabs', providerVoiceId: 'sarah', recommended: true },
  { key: 'rohan', label: 'Rohan, friendly and upbeat', provider: 'elevenlabs', providerVoiceId: 'rohan' },
  { key: 'paige', label: 'Paige, clear and efficient', provider: 'elevenlabs', providerVoiceId: 'paige' },
  { key: 'spencer', label: 'Spencer, deep and steady', provider: 'elevenlabs', providerVoiceId: 'spencer' },
  { key: 'lily', label: 'Lily, soft-spoken and patient', provider: 'elevenlabs', providerVoiceId: 'lily' },
  { key: 'cole', label: 'Cole, casual and conversational', provider: 'elevenlabs', providerVoiceId: 'cole' },
  { key: 'savannah', label: 'Savannah, energetic and bright', provider: 'elevenlabs', providerVoiceId: 'savannah' },
];

export const DEFAULT_VOICE_KEY = 'elliot';

export function isValidVoiceKey(key: string): boolean {
  return VOICE_OPTIONS.some((voice) => voice.key === key);
}

export function resolveProviderVoiceId(key: string): string {
  const voice = VOICE_OPTIONS.find((option) => option.key === key);
  if (!voice) {
    throw new Error(`Unknown voice key: ${key}`);
  }
  return voice.providerVoiceId;
}
