import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  DATABASE_URL: z.string().url(),

  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(1, 'ADMIN_PASSWORD_HASH is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default('./storage'),

  MAX_GENERATIONS_PER_DAY: z.coerce.number().int().positive().default(100),
  MAX_LLM_COST_USD_PER_DAY: z.coerce.number().positive().default(10),

  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(z.treeifyError(parsed.error));
  throw new Error('Invalid environment configuration. See errors above.');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
