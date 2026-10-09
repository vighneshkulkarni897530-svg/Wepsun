import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeAllAccounts() {
  console.log('🚀 Starting complete cleanup of user accounts and sessions...');

  try {
    const deletedSessions = await prisma.userSession.deleteMany({});
    console.log(`✅ Deleted ${deletedSessions.count} login sessions (userSession).`);

    const deletedResetTokens = await prisma.passwordResetToken.deleteMany({});
    console.log(`✅ Deleted ${deletedResetTokens.count} password reset tokens.`);

    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} user accounts (all users wiped).`);

    console.log('🎉 Database is now completely clean of all user accounts and sessions!');
  } catch (error) {
    console.error('❌ Error wiping accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeAllAccounts();
