import { prisma } from '../src/lib/prisma.js';
import { scrubLegacyUserAgentCredentials } from '../src/lib/auth.js';

async function main() {
  const scrubbedCount = await scrubLegacyUserAgentCredentials();
  console.log(`✅ Scrubbed legacy userAgent credentials from ${scrubbedCount} rows in user_sessions table.`);

  // Also check if any remaining rows in user_sessions have JSON in userAgent
  const remaining = await prisma.userSession.count({
    where: { userAgent: { startsWith: '{' } },
  });
  console.log(`Remaining user_sessions rows with JSON userAgent: ${remaining}`);
}

main().catch(console.error).finally(() => process.exit(0));
