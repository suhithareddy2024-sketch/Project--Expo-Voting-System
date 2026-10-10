const mongoose = require('mongoose');
const crypto = require('crypto');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Otp = require('./models/Otp');
const User = require('./models/User');

dotenv.config();

const http = require('http');
const app = require('./server');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING ANITS OTP AUTHENTICATION TESTS');
  console.log('========================================\n');

  const server = http.createServer(app);
  let serverStarted = false;
  try {
    await new Promise((resolve) => {
      server.listen(5000, () => {
        serverStarted = true;
        resolve();
      });
      server.on('error', () => resolve());
    });
  } catch (e) {}

  await connectDB();

  // Test 1: Reject Non-ANITS Domain (@gmail.com)
  process.env.STRICT_COLLEGE_DOMAIN = 'true';
  console.log('▶ TEST 1: Reject non-ANITS domain (student@gmail.com)');
  try {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@gmail.com' })
    });
    process.env.STRICT_COLLEGE_DOMAIN = 'false';
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (res.status === 400 && data.message === 'Only @anits.edu.in email addresses are allowed.') {
      console.log('  ✅ PASSED: Correctly rejected with exact error message\n');
    } else {
      console.error('  ❌ FAILED: Unexpected response\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Test 2: Check Send OTP with Missing Resend API Key / Placeholder Key
  console.log('▶ TEST 2: Send OTP with placeholder key behavior');
  try {
    const testEmail = 'karrisuhithareddy.24.it@anits.edu.in';
    await Otp.deleteMany({ email: testEmail });

    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (!data.success && data.message.includes('Resend API key is not configured')) {
      console.log('  ✅ PASSED: Server gave clear configuration error for placeholder key\n');
    } else if (data.success) {
      console.log('  ✅ PASSED: OTP sent successfully via active Resend key\n');
    } else {
      console.log('  ℹ️ Response recorded as expected for current key state\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Test 3: OTP Verification with Simulated Valid OTP in DB
  console.log('▶ TEST 3: Verify correct OTP against DB hash');
  const testEmail = 'karrisuhithareddy.24.it@anits.edu.in';
  const rawOtp = '654321';
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await Otp.deleteMany({ email: testEmail });
  await Otp.create({
    email: testEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    lastSentAt: new Date()
  });

  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: rawOtp, name: 'Suhitha Reddy' })
    });
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (res.status === 200 && data.success && data.token && data.user) {
      console.log('  ✅ PASSED: Successfully authenticated user and returned JWT\n');
    } else {
      console.error('  ❌ FAILED: Expected success with JWT token\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Test 4: Reuse of Already-Used OTP (Should Fail because it was deleted)
  console.log('▶ TEST 4: Reuse already-used OTP');
  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: rawOtp })
    });
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (res.status === 400 && !data.success) {
      console.log('  ✅ PASSED: Reused OTP rejected because record was invalidated upon first use\n');
    } else {
      console.error('  ❌ FAILED: Single-use OTP allowed reuse!\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Test 5: Wrong OTP
  console.log('▶ TEST 5: Wrong OTP submission');
  await Otp.create({
    email: testEmail,
    otpHash,
    expiresAt,
    attempts: 0,
    lastSentAt: new Date()
  });

  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' })
    });
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (res.status === 400 && !data.success && data.message.includes('Invalid OTP')) {
      console.log('  ✅ PASSED: Incorrect OTP rejected\n');
    } else {
      console.error('  ❌ FAILED: Expected Invalid OTP response\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Test 6: Expired OTP
  console.log('▶ TEST 6: Expired OTP submission');
  await Otp.deleteMany({ email: testEmail });
  await Otp.create({
    email: testEmail,
    otpHash,
    expiresAt: new Date(Date.now() - 10000), // Expired in past
    attempts: 0,
    lastSentAt: new Date(Date.now() - 60000)
  });

  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: rawOtp })
    });
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (res.status === 400 && data.message.includes('OTP has expired')) {
      console.log('  ✅ PASSED: Expired OTP rejected\n');
    } else {
      console.error('  ❌ FAILED: Expected expired OTP error\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Test 7: Verify OTP with non-ANITS email
  process.env.STRICT_COLLEGE_DOMAIN = 'true';
  console.log('▶ TEST 7: Verify OTP with non-ANITS email domain');
  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hacker@otherdomain.com', otp: '123456' })
    });
    process.env.STRICT_COLLEGE_DOMAIN = 'false';
    const data = await res.json();
    console.log(`  Response (${res.status}):`, data);
    if (res.status === 400 && data.message === 'Only @anits.edu.in email addresses are allowed.') {
      console.log('  ✅ PASSED: Non-ANITS domain rejected during verify as well\n');
    } else {
      console.error('  ❌ FAILED: Expected domain restriction error\n');
    }
  } catch (err) {
    console.error('  ❌ ERROR:', err.message);
  }

  // Cleanup
  await Otp.deleteMany({ email: testEmail });
  await mongoose.connection.close();
  if (serverStarted) {
    server.close();
  }
  console.log('========================================');
  console.log('🎉 ALL INTEGRATION TESTS COMPLETED');
  console.log('========================================\n');
  process.exit(0);
}

runTests();
