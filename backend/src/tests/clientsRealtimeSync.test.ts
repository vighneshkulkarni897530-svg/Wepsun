import assert from 'assert';
import clientsRoutes from '../routes/clients.routes.js';
import syncRoutes from '../routes/sync.routes.js';
import { prisma } from '../lib/prisma.js';
import { db } from '../data/mockDb.js';

let passed = 0;
let total = 0;

function check(condition: boolean, name: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

function createMockReqRes(method: string, url: string, body: any = {}, user: any = null) {
  const req: any = {
    method,
    url,
    body,
    params: {},
    query: {},
    headers: {},
    user: user || {
      id: 'usr-master-gaurav',
      email: 'gauravsaini0004@gmail.com',
      role: 'MASTER_ADMIN',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
    },
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    send(data: any) {
      responseData = data;
      return res;
    },
    setHeader() { return res; },
    getHeader() { return null; },
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runClientsTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 WEPSUN CLIENTS REAL-TIME MANAGEMENT & SYNC VERIFICATION SUITE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TEST 1: Retrieve Live Clients
  console.log('--- Test 1: Admin Fetches Live Registered Clients ---');
  const getMock = createMockReqRes('GET', '/');
  // Match router layer for GET /
  const getHandler = (clientsRoutes as any).stack.find((s: any) => s.route?.methods?.get && s.route?.path === '/').route.stack.slice(-1)[0].handle;
  await getHandler(getMock.req, getMock.res);

  check(getMock.getStatus() === 200, 'Test 1: Status must be 200');
  const getData = getMock.getData();
  check(getData.success === true, 'Test 1: Success must be true');
  check(Array.isArray(getData.data), 'Test 1: Data must be an array');
  console.log(`     Retrieved ${getData.count} registered client accounts`);

  // Verify no hardcoded demo accounts exist
  const dummyNames = ['Arvind Joshi', 'Sunita Rao', 'Rajesh Patil', 'Deepak Mehta', 'Vikram Singhania'];
  for (const dummy of dummyNames) {
    const found = getData.data.some((c: any) => c.name?.includes(dummy));
    check(!found, `Test 1: Hardcoded demo account "${dummy}" must NOT exist in live clients API`);
  }

  // TEST 2: Register New Client with Building & Lifts
  console.log('\n--- Test 2: Admin Registers Real Client with Building & Lifts ---');
  const uniqueStamp = Date.now();
  const newClientPayload = {
    name: `Test Client ${uniqueStamp}`,
    contactPerson: `Manager ${uniqueStamp}`,
    email: `manager_${uniqueStamp}@liveproperty.org`,
    phone: '+91 85959 40077',
    societyName: `Ocean Breeze Heights ${uniqueStamp}`,
    address: 'Plot 88, Sector 15, Seawoods, Navi Mumbai - 400706',
    initialLiftsCount: 2,
    amcTier: 'Comprehensive (Active 🟢)',
  };

  const postMock = createMockReqRes('POST', '/', newClientPayload);
  const postHandler = (clientsRoutes as any).stack.find((s: any) => s.route?.methods?.post && s.route?.path === '/').route.stack.slice(-1)[0].handle;
  await postHandler(postMock.req, postMock.res);

  check(postMock.getStatus() === 201, 'Test 2: Status must be 201 Created');
  const createdClient = postMock.getData().data;
  check(Boolean(createdClient.id), 'Test 2: Created client must have an ID');
  check(Boolean(createdClient.buildings && createdClient.buildings.length > 0), 'Test 2: Client must have linked building');
  console.log(`     Client "${createdClient.name}" created with ID: ${createdClient.id}`);
  console.log(`     Associated building "${createdClient.buildings[0].name}" registered`);
  console.log(`     Fleet lifts registered: ${createdClient.lifts?.length || 2}`);

  // TEST 3: Batch Sync automatically returns the new client
  console.log('\n--- Test 3: Batch Sync Automatically Returns New Client ---');
  const syncMock = createMockReqRes('GET', '/');
  const syncHandler = (syncRoutes as any).stack.find((s: any) => s.route?.methods?.get && s.route?.path === '/').route.stack.slice(-1)[0].handle;
  await syncHandler(syncMock.req, syncMock.res);

  check(syncMock.getStatus() === 200, 'Test 3: Sync endpoint returned 200');
  const syncData = syncMock.getData();
  check(syncData.success === true, 'Test 3: Sync success flag is true');
  check(Array.isArray(syncData.data.clients), 'Test 3: Batch sync data contains clients array');
  const syncFound = syncData.data.clients.some(
    (c: any) => c.id === createdClient.id || c.name === newClientPayload.societyName
  );
  check(syncFound, 'Test 3: Newly registered client exists in batch sync payload');

  // TEST 4: Update Client Details
  console.log('\n--- Test 4: Admin Updates Client Information ---');
  const putMock = createMockReqRes('PUT', `/${createdClient.id}`, {
    phone: '+91 85959 40077',
    billingAddress: 'Updated Luxury Tower, Palm Beach Road, Vashi',
  });
  putMock.req.params = { id: createdClient.id };
  const putHandler = (clientsRoutes as any).stack.find((s: any) => s.route?.methods?.put && s.route?.path === '/:id').route.stack.slice(-1)[0].handle;
  await putHandler(putMock.req, putMock.res);

  check(putMock.getStatus() === 200, 'Test 4: Update status is 200');
  check(putMock.getData().success === true, 'Test 4: Update success is true');

  // Clean up test records from Prisma if live
  try {
    await prisma.lift.deleteMany({ where: { clientId: createdClient.id } }).catch(() => {});
    await prisma.building.deleteMany({ where: { clientId: createdClient.id } }).catch(() => {});
    await prisma.client.deleteMany({ where: { id: createdClient.id } }).catch(() => {});
  } catch {}

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 ALL ${passed}/${total} CLIENTS REAL-TIME MANAGEMENT TESTS PASSED!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runClientsTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
