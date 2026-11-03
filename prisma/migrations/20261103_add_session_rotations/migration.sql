-- CreateTable: session_rotations for cryptographically encrypted rotation recovery
CREATE TABLE IF NOT EXISTS "session_rotations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "oldTokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revocationReason" TEXT NOT NULL DEFAULT 'ROTATED',

    CONSTRAINT "session_rotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "session_rotations_oldTokenHash_key" ON "session_rotations"("oldTokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_rotations_oldTokenHash_idx" ON "session_rotations"("oldTokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "session_rotations_userId_idx" ON "session_rotations"("userId");

