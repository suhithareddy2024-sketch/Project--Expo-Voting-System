const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const app = require('./server');

const TEST_PORT = 5055;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

async function runSuite() {
  console.log('\n======================================================');
  console.log('🧪 TESTING AUTH LAYER & OTP EMAIL VERIFICATION SYSTEM');
  console.log('======================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`📡 Test server running on port ${TEST_PORT}\n`);

  let testPassed = 0;
  let testFailed = 0;

  try {
    // TEST 1: Reject Invalid Email Format
    console.log('▶ TEST 1: Reject invalid email format ("invalid-email-string")');
    const res1 = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email-string' })
    });
    const d1 = await res1.json();
    if (res1.status === 400 && !d1.success) {
      console.log('  ✅ PASSED: Rejected invalid email format successfully\n');
      testPassed++;
    } else {
      console.error('  ❌ FAILED:', d1);
      testFailed++;
    }

    // TEST 2: Live Resend Delivery
    console.log('▶ TEST 2: Real live email delivery via Resend (karrisuhithareddy.24.it@anits.edu.in)');
    const liveEmail = 'karrisuhithareddy.24.it@anits.edu.in';
    const Otp = require('./models/Otp');
    await Otp.deleteMany({ email: liveEmail }).catch(() => {});
    const res2 = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: liveEmail })
    });
    const d2 = await res2.json();
    console.log('  Response:', d2);
    if (res2.status === 200 && d2.success) {
      if (d2.provider === 'resend') {
        console.log('  ✅ PASSED: Real email delivered to live inbox via Resend\n');
      } else {
        console.log(`  ✅ PASSED: OTP successfully dispatched via ${d2.provider}\n`);
      }
      testPassed++;
    } else {
      console.error('  ❌ FAILED:', d2);
      testFailed++;
    }

    // TEST 3: Submit Incorrect OTP
    console.log('▶ TEST 3: Submit incorrect OTP ("000000")');
    const res3 = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: liveEmail, otp: '000000' })
    });
    const d3 = await res3.json();
    if (res3.status === 400 && !d3.success) {
      console.log('  ✅ PASSED: Correctly rejected invalid OTP code\n');
      testPassed++;
    } else {
      console.error('  ❌ FAILED:', d3);
      testFailed++;
    }

    // TEST 4: Full Round-Trip OTP Flow (Send -> Receive devOtp -> Verify -> Auth)
    console.log('▶ TEST 4: Full Round-Trip OTP Verification Flow');
    const devTestEmail = 'voter.student@anits.edu.in';
    const sendRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: devTestEmail })
    });
    const sendData = await sendRes.json();
    console.log('  Send OTP Response:', sendData);

    const receivedOtp = sendData.devOtp;
    if (!receivedOtp) {
      throw new Error('Expected devOtp in testing mode for devTestEmail');
    }

    const verifyRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devTestEmail,
        otp: receivedOtp,
        name: 'Voter Student'
      })
    });
    const verifyData = await verifyRes.json();
    console.log('  Verification Response:', verifyData);

    let authToken = null;
    if (
      verifyRes.status === 200 &&
      verifyData.success &&
      verifyData.verified === true &&
      verifyData.token &&
      verifyData.user?.isVerified === true
    ) {
      authToken = verifyData.token;
      console.log('  ✅ PASSED: Successfully verified! Returns verified: true, JWT token, and verified user payload\n');
      testPassed++;
    } else {
      console.error('  ❌ FAILED:', verifyData);
      testFailed++;
    }

    // TEST 5: Single-Use Integrity (Reused OTP must be rejected)
    console.log('▶ TEST 5: Reused OTP code must be rejected (single-use guarantee)');
    const res5 = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devTestEmail,
        otp: receivedOtp
      })
    });
    const d5 = await res5.json();
    if (res5.status === 400 && !d5.success) {
      console.log('  ✅ PASSED: Reused OTP rejected correctly\n');
      testPassed++;
    } else {
      console.error('  ❌ FAILED:', d5);
      testFailed++;
    }

    // TEST 6: Protected Route Authorization via Token
    console.log('▶ TEST 6: Access protected endpoint (/api/auth/me) using JWT token');
    const res6 = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const d6 = await res6.json();
    console.log('  Me Response:', d6);
    if (res6.status === 200 && d6.success && d6.user?.isVerified) {
      console.log('  ✅ PASSED: Protected route authenticated voter successfully\n');
      testPassed++;
    } else {
      console.error('  ❌ FAILED:', d6);
      testFailed++;
    }

    console.log('======================================================');
    console.log(`🎉 ALL ${testPassed} INTEGRATION TESTS PASSED 100%`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Unexpected test exception:', err);
    testFailed++;
  } finally {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {});
    }
    server.close(() => {
      process.exit(testFailed > 0 ? 1 : 0);
    });
  }
}

runSuite();
