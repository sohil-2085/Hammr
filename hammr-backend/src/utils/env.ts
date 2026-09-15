import 'dotenv/config';

const requiredEnv = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'TWO_FACTOR_ENCRYPTION_KEY',
  'FRONTEND_ORIGIN',
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.TWO_FACTOR_ENCRYPTION_KEY!.length !== 64) {
  throw new Error(
    'TWO_FACTOR_ENCRYPTION_KEY must be a 32-byte key represented as 64 hexadecimal characters.',
  );
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  twoFactorEncryptionKey: process.env.TWO_FACTOR_ENCRYPTION_KEY!,
  frontendOrigin: process.env.FRONTEND_ORIGIN!,
  port: Number(process.env.PORT ?? 4000),
};