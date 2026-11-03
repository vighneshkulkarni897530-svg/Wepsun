import { prisma } from '../src/lib/prisma.js';

async function main() {
  const tables = await prisma.$queryRawUnsafe<any[]>('SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' ORDER BY table_name;');
  console.log('Tables:', tables.map(r => r.table_name));

  const columns = await prisma.$queryRawUnsafe<any[]>('SELECT column_name, data_type FROM information_schema.columns WHERE table_name=\'user_sessions\';');
  console.log('user_sessions columns:', columns);
}

main().catch(console.error).finally(() => process.exit(0));
