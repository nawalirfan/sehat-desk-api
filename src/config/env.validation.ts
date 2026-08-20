import { z } from 'zod';

// Checked once at boot so a missing var fails loudly here, not on the first request that needs it.
export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_PATH: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  VAPI_API_KEY: z.string().min(1),
  VAPI_ASSISTANT_ID: z.string().min(1),
  VAPI_TOOL_WEBHOOK_SECRET: z.string().min(1),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
