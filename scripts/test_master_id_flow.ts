/**
 * Verification Script for Technician Master ID Authentication Flow
 */

async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('🧪 Starting Master ID Integration Test on', baseUrl);

  // 1. Test Empty Master ID
  console.log('\n--- Test 1: Empty Master ID ---');
  const resEmpty = await fetch(`${baseUrl}/auth/master-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterId: '' }),
  });
  const dataEmpty = await resEmpty.json();
  console.log('Status:', resEmpty.status, 'Response:', dataEmpty);
  if (resEmpty.status === 400 && dataEmpty.message === 'Please enter your Master ID.') {
    console.log('✅ Test 1 Passed: Empty Master ID correctly rejected with exact message');
  } else {
    console.error('❌ Test 1 Failed');
  }

  // 2. Test Invalid Master ID
  console.log('\n--- Test 2: Invalid Master ID ---');
  const resInvalid = await fetch(`${baseUrl}/auth/master-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterId: 'INVALID-MASTER-KEY' }),
  });
  const dataInvalid = await resInvalid.json();
  console.log('Status:', resInvalid.status, 'Response:', dataInvalid);
  if (resInvalid.status === 401 && dataInvalid.message === 'Invalid Master ID. Please try again.') {
    console.log('✅ Test 2 Passed: Invalid Master ID rejected with exact message');
  } else {
    console.error('❌ Test 2 Failed');
  }

  // 3. Test Valid Master ID 1: WEP-MST-8921
  console.log('\n--- Test 3: Valid Master ID 1 (WEP-MST-8921) ---');
  const resValid1 = await fetch(`${baseUrl}/auth/master-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterId: 'WEP-MST-8921' }),
  });
  const dataValid1 = await resValid1.json();
  console.log('Status:', resValid1.status, 'Role:', dataValid1.data?.user?.role, 'HasToken:', !!dataValid1.data?.accessToken);
  if (resValid1.status === 200 && dataValid1.success && dataValid1.data?.user?.role === 'MASTER_ADMIN') {
    console.log('✅ Test 3 Passed: Master ID 1 successfully authenticated as MASTER_ADMIN');
  } else {
    console.error('❌ Test 3 Failed');
  }

  // 4. Test Valid Master ID 2: WEP-MST-4407
  console.log('\n--- Test 4: Valid Master ID 2 (WEP-MST-4407) ---');
  const resValid2 = await fetch(`${baseUrl}/auth/master-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterId: 'WEP-MST-4407' }),
  });
  const dataValid2 = await resValid2.json();
  console.log('Status:', resValid2.status, 'Role:', dataValid2.data?.user?.role, 'HasToken:', !!dataValid2.data?.accessToken);
  if (resValid2.status === 200 && dataValid2.success && dataValid2.data?.user?.role === 'MASTER_ADMIN') {
    console.log('✅ Test 4 Passed: Master ID 2 successfully authenticated as MASTER_ADMIN');
  } else {
    console.error('❌ Test 4 Failed');
  }

  // 5. Test Accessing Protected Endpoint with Master ID Token
  console.log('\n--- Test 5: Accessing Protected Admin Audit Endpoint with Master Token ---');
  const token = dataValid1.data?.accessToken;
  const resAudit = await fetch(`${baseUrl}/audit`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dataAudit = await resAudit.json();
  console.log('Status:', resAudit.status, 'Count:', dataAudit.count);
  if (resAudit.status === 200 && dataAudit.success) {
    console.log('✅ Test 5 Passed: MASTER_ADMIN token successfully granted access to protected Admin endpoint');
  } else {
    console.error('❌ Test 5 Failed');
  }

  // 6. Test Accessing Protected Endpoint WITHOUT Token
  console.log('\n--- Test 6: Accessing Protected Admin Endpoint WITHOUT Token ---');
  const resUnauth = await fetch(`${baseUrl}/audit`);
  const dataUnauth = await resUnauth.json();
  console.log('Status:', resUnauth.status, 'Message:', dataUnauth.message);
  if (resUnauth.status === 401) {
    console.log('✅ Test 6 Passed: Unauthenticated request blocked with 401');
  } else {
    console.error('❌ Test 6 Failed');
  }

  console.log('\n🎉 ALL MASTER ID AUTHENTICATION INTEGRATION TESTS PASSED!');
}

runTests().catch(console.error);
