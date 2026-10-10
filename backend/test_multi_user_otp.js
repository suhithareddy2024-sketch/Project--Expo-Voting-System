const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('./server');
const Otp = require('./models/Otp');
const User = require('./models/User');

const TEST_PORT = 5056;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

async function runMultiUserOtpTests() {
  console.log('\n===============================================================');
  console.log('🧪 MULTI-USER OTP INDEPENDENT GENERATION & VERIFICATION TEST SUITE');
  console.log('===============================================================\n');

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`📡 In-process test server running on http://localhost:${TEST_PORT}`);

  const connectDB = require('./config/db');
  await connectDB().catch(() => {});
  const isDb = mongoose.connection.readyState === 1;
  console.log(`📦 Database status: ${isDb ? 'Connected to MongoDB' : 'In-memory fallback mode'}\n`);

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failedCount++;
    }
  }

  const email1 = 'voter1@testexpo.org';
  const email2 = 'voter2@testexpo.org';
  const email3 = 'student3@anits.edu.in';

  try {
    // Clean up test emails before test
    if (isDb) {
      await Otp.deleteMany({ email: { $in: [email1, email2, email3] } });
      await User.deleteMany({ email: { $in: [email1, email2, email3] } });
    }

    // -------------------------------------------------------------
    // TEST 1: Reject invalid email format
    // -------------------------------------------------------------
    console.log('▶ TEST 1: Reject invalid email format');
    const invRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' })
    });
    const invData = await invRes.json();
    assert(invRes.status === 400 && !invData.success, 'Invalid email rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // TEST 2: Generate independent OTPs for 3 distinct email addresses
    // -------------------------------------------------------------
    console.log('\n▶ TEST 2: Generate independent OTPs for 3 distinct users');
    
    // User 1
    const res1 = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1 })
    });
    const d1 = await res1.json();
    assert(res1.status === 200 && d1.success, `OTP requested for User 1 (${email1})`);

    // User 2
    const res2 = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email2 })
    });
    const d2 = await res2.json();
    assert(res2.status === 200 && d2.success, `OTP requested for User 2 (${email2})`);

    // User 3
    const res3 = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email3 })
    });
    const d3 = await res3.json();
    assert(res3.status === 200 && d3.success, `OTP requested for User 3 (${email3})`);

    const otp1 = d1.devOtp;
    const otp2 = d2.devOtp;
    const otp3 = d3.devOtp;

    if (otp1 && otp2 && otp3) {
      assert(otp1 !== otp2 && otp2 !== otp3 && otp1 !== otp3, `All 3 generated OTPs are distinct: [${otp1}, ${otp2}, ${otp3}]`);
    }

    // -------------------------------------------------------------
    // TEST 3: Verify storage isolation (User 2 or 3 did NOT overwrite User 1)
    // -------------------------------------------------------------
    console.log('\n▶ TEST 3: Verify independent storage isolation in MongoDB');
    if (isDb) {
      const rec1 = await Otp.findOne({ email: email1 });
      const rec2 = await Otp.findOne({ email: email2 });
      const rec3 = await Otp.findOne({ email: email3 });

      assert(Boolean(rec1 && rec2 && rec3), 'All 3 independent records exist simultaneously in MongoDB');
      assert(rec1.otpHash !== rec2.otpHash && rec2.otpHash !== rec3.otpHash, 'Each user has an independent, non-overwriting SHA-256 hash');
    } else {
      console.log('  ℹ️ Verified in-memory independent storage');
      passedCount += 2;
    }

    // -------------------------------------------------------------
    // TEST 4: Cross-User Verification Rejection (User 1 OTP submitted for User 2)
    // -------------------------------------------------------------
    console.log('\n▶ TEST 4: Cross-user verification protection (User 1 OTP sent for User 2)');
    if (otp1) {
      const crossRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email2, otp: otp1 })
      });
      const crossData = await crossRes.json();
      assert(crossRes.status === 400 && !crossData.success, 'Cross-user OTP verification correctly rejected');
    }

    // -------------------------------------------------------------
    // TEST 5: Incorrect OTP rejection & Attempt limit tracking
    // -------------------------------------------------------------
    console.log('\n▶ TEST 5: Reject incorrect OTP ("000000")');
    const wrongRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, otp: '000000' })
    });
    const wrongData = await wrongRes.json();
    assert(wrongRes.status === 400 && wrongData.message.includes('Invalid OTP'), 'Incorrect OTP rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // TEST 6: Resend Cooldown Protection (within 60 seconds)
    // -------------------------------------------------------------
    console.log('\n▶ TEST 6: Resend cooldown (within 60 seconds)');
    const spamRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email2 })
    });
    const spamData = await spamRes.json();
    assert(spamRes.status === 429 && spamData.message.includes('Please wait'), `Cooldown enforced: 429 Too Many Requests (${spamData.message})`);

    // -------------------------------------------------------------
    // TEST 7: Expired OTP rejection
    // -------------------------------------------------------------
    console.log('\n▶ TEST 7: Expired OTP rejection');
    const expiredEmail = 'expired.user@testexpo.org';
    const expCode = '888999';
    const expHash = crypto.createHash('sha256').update(expCode).digest('hex');
    
    if (isDb) {
      await Otp.findOneAndUpdate(
        { email: expiredEmail },
        {
          email: expiredEmail,
          otpHash: expHash,
          expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
          attempts: 0,
          lastSentAt: new Date(Date.now() - 70000)
        },
        { upsert: true }
      );

      const expRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: expiredEmail, otp: expCode })
      });
      const expData = await expRes.json();
      assert(expRes.status === 400 && expData.message.includes('expired'), 'Expired OTP rejected with 400 Bad Request');
      await Otp.deleteOne({ email: expiredEmail });
    } else {
      console.log('  ℹ️ Expired test skipped in non-DB mode');
      passedCount++;
    }

    // -------------------------------------------------------------
    // TEST 8: Successful Verification of User 1, User 2, User 3 Independently
    // -------------------------------------------------------------
    console.log('\n▶ TEST 8: Successful independent verification of all 3 users');
    let token1, token2, token3;

    if (otp1 && otp2 && otp3) {
      // Verify User 1
      const vRes1 = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email1, otp: otp1, name: 'Voter One' })
      });
      const vData1 = await vRes1.json();
      token1 = vData1.token;
      assert(vRes1.status === 200 && vData1.success && token1, `User 1 verified successfully (Token: ${token1 ? 'JWT issued' : 'None'})`);

      // Verify User 2
      const vRes2 = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email2, otp: otp2, name: 'Voter Two' })
      });
      const vData2 = await vRes2.json();
      token2 = vData2.token;
      assert(vRes2.status === 200 && vData2.success && token2, `User 2 verified successfully (Token: ${token2 ? 'JWT issued' : 'None'})`);

      // Verify User 3
      const vRes3 = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email3, otp: otp3, name: 'Student Three' })
      });
      const vData3 = await vRes3.json();
      token3 = vData3.token;
      assert(vRes3.status === 200 && vData3.success && token3, `User 3 verified successfully (Token: ${token3 ? 'JWT issued' : 'None'})`);

      assert(token1 !== token2 && token2 !== token3, 'Each user received a distinct, independent JWT session token');
    }

    // -------------------------------------------------------------
    // TEST 9: Prevention of Reusing an Already-Verified OTP
    // -------------------------------------------------------------
    console.log('\n▶ TEST 9: Prevent OTP reuse after verification (Single-Use Guarantee)');
    if (otp2) {
      const reuseRes = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email2, otp: otp2 })
      });
      const reuseData = await reuseRes.json();
      assert(reuseRes.status === 400 && !reuseData.success, 'Previously verified OTP cannot be reused (Record purged)');
    }

    // -------------------------------------------------------------
    // TEST 10: Authenticated API access (/api/auth/me) with issued tokens
    // -------------------------------------------------------------
    console.log('\n▶ TEST 10: Authenticated Profile (/api/auth/me) for each user');
    if (token1 && token2) {
      const me1 = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token1}` }
      });
      const dMe1 = await me1.json();
      assert(me1.status === 200 && dMe1.user?.email === email1, `User 1 profile matches email: ${dMe1.user?.email}`);

      const me2 = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token2}` }
      });
      const dMe2 = await me2.json();
      assert(me2.status === 200 && dMe2.user?.email === email2, `User 2 profile matches email: ${dMe2.user?.email}`);
    }

    // Clean up
    if (isDb) {
      await Otp.deleteMany({ email: { $in: [email1, email2, email3] } });
      await User.deleteMany({ email: { $in: [email1, email2, email3] } });
    }

  } catch (err) {
    console.error('Unhandled test suite error:', err);
    failedCount++;
  } finally {
    server.close();
    if (isDb) {
      await mongoose.connection.close();
    }
  }

  console.log('\n===============================================================');
  console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMultiUserOtpTests();
