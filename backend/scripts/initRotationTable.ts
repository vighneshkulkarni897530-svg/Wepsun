import { prisma } from '../src/lib/prisma.js';

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS session_rotations (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "oldTokenHash" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "encryptedPayload" TEXT NOT NULL,
      "rotatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "expiresAt" TIMESTAMP NOT NULL,
      "revocationReason" TEXT NOT NULL DEFAULT 'ROTATED'
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_session_rotations_old_token ON session_rotations("oldTokenHash");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_session_rotations_user ON session_rotations("userId");
  `);
  console.log('✅ session_rotations table verified/created in PostgreSQL');
}

main().catch(console.error).finally(() => process.exit(0));
