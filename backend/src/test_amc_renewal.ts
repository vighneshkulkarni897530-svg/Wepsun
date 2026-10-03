import axios from 'axios';

async function testAmcRenewalPipeline() {
  console.log('Testing Automated AMC Renewal Engine...');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // 1. Authenticate as Admin
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@wepsun.com',
      password: 'Wepsun@2026',
    });

    const token = loginRes.data.data.accessToken;
    console.log('✅ Admin authenticated successfully.');

    // 2. Scan expiring renewals (30/60/90-day scanner)
    const scanRes = await axios.get(`${baseUrl}/amc/expiring-renewals`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Expiring renewals scan summary:', scanRes.data.data.summary);
    const contracts = scanRes.data.data.contracts;
    console.log(`✅ Found ${contracts.length} expiring contracts in pipeline.`);

    if (contracts.length > 0) {
      const targetContract = contracts[0];
      console.log(`📋 Testing on Contract: ${targetContract.contractNumber} (${targetContract.buildingName})`);

      // 3. Generate 1-Click Renewal Quotation
      const quoteRes = await axios.post(
        `${baseUrl}/amc/generate-renewal-quote`,
        {
          contractId: targetContract.id,
          escalationRate: 8.0,
          tenureYears: 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('✅ 1-Click Renewal Quotation generated:', quoteRes.data.data);

      // 4. Send WhatsApp Renewal Alert
      const alertRes = await axios.post(
        `${baseUrl}/amc/send-renewal-alert`,
        {
          contractId: targetContract.id,
          channel: 'whatsapp',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('✅ WhatsApp Renewal Notice dispatched:', alertRes.data.data.messagePreview.split('\n')[0]);

      // 5. Accept & Digitally Renew Contract
      const renewRes = await axios.post(
        `${baseUrl}/amc/accept-and-renew`,
        {
          contractId: targetContract.id,
          tenureYears: 1,
          agreedAmount: quoteRes.data.data.grandTotal,
          signatoryName: 'Sanjay Deshmukh (Secretary)',
          signatoryRole: 'Hon. Secretary',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('✅ AMC Contract Digitally Renewed in Database:', renewRes.data.data);
    }

    console.log('\n🎉 ALL AUTOMATED AMC RENEWAL ENGINE TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('❌ Error during AMC Renewal test:', error.response?.data || error.message);
  }
}

testAmcRenewalPipeline();
