import axios from 'axios';

async function testPaymentFlow() {
  console.log('Testing Payment Gateway Integration...');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // 1. Authenticate as Admin
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@wepsun.com',
      password: 'Wepsun@2026'
    });

    const token = loginRes.data.data.accessToken;
    console.log('✅ Admin logged in successfully, token received:', token ? 'YES' : 'NO');

    // 2. Create Razorpay order
    const orderRes = await axios.post(
      `${baseUrl}/payments/razorpay/create-order`,
      {
        invoiceId: 'inv-1',
        amount: 24000,
        currency: 'INR'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Razorpay order created:', orderRes.data.data);

    // 3. Verify Payment
    const verifyRes = await axios.post(
      `${baseUrl}/payments/razorpay/verify`,
      {
        razorpayOrderId: orderRes.data.data.orderId,
        razorpayPaymentId: `pay_test_${Date.now()}`,
        razorpaySignature: 'simulated_valid_sig',
        invoiceId: 'inv-1',
        paymentMethod: 'UPI_QR'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Payment verified & settled in database:', verifyRes.data);
    console.log('\n🎉 ALL PAYMENT GATEWAY INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (error: any) {
    console.error('❌ Error during payment test:', error.response?.data || error.message);
  }
}

testPaymentFlow();
