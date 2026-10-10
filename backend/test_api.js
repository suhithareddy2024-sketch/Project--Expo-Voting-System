const http = require('http');

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (dataString) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(responseBody);
        } catch (e) {
          parsed = responseBody;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', (e) => reject(e));
    if (dataString) req.write(dataString);
    req.end();
  });
};

async function runTests() {
  console.log('==============================================');
  console.log('--- EXPO VOTING SYSTEM: API VALIDATION ---');
  console.log('==============================================\n');

  const app = require('./server');
  const server = http.createServer(app);
  let serverStarted = false;
  try {
    await new Promise((resolve, reject) => {
      server.listen(5000, () => {
        serverStarted = true;
        resolve();
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          // Already running externally
          resolve();
        } else {
          reject(err);
        }
      });
    });
  } catch (e) {}

  try {
    // 1. Health Check
    console.log('1. Testing GET /api/health...');
    const health = await request('GET', '/api/health');
    console.log(`Status: ${health.status}`, health.body);
    if (health.status !== 200 || health.body.status !== 'OK') throw new Error('Health check failed');

    // 2. Register User (Using exact prompt format)
    const timestamp = Date.now();
    const testEmail = `test_voter_${timestamp}@example.com`;
    console.log(`\n2. Testing POST /api/auth/register (${testEmail})...`);
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Test Voter',
      email: testEmail,
      password: 'password123',
      role: 'user'
    });
    console.log(`Status: ${regRes.status}`, regRes.body);
    if (regRes.status !== 201) throw new Error('User register failed');
    const voterToken = regRes.body.token;

    // 3. Login
    console.log('\n3. Testing POST /api/auth/login...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: 'password123'
    });
    console.log(`Status: ${loginRes.status}`, `Token received: ${loginRes.body.token ? 'YES' : 'NO'}`);
    if (loginRes.status !== 200 || !loginRes.body.token) throw new Error('Login failed');

    // Login as Admin
    console.log('\n3b. Testing POST /api/admin/login...');
    const adminLoginRes = await request('POST', '/api/admin/login', {
      email: 'karrisuhithareddy.24.it@anits.edu.in',
      password: 'anits148'
    });
    console.log(`Status: ${adminLoginRes.status}`, `Admin Token received: ${adminLoginRes.body.token ? 'YES' : 'NO'}`);
    if (adminLoginRes.status !== 200 || !adminLoginRes.body.token) throw new Error('Admin login failed');
    const adminToken = adminLoginRes.body.token;

    // 4. Create/Get Projects
    console.log('\n4. Testing GET /api/projects...');
    const projectsRes = await request('GET', '/api/projects');
    console.log(`Status: ${projectsRes.status}, Total projects in DB: ${projectsRes.body.count}`);
    if (projectsRes.status !== 200 || projectsRes.body.data.length === 0) throw new Error('Get projects failed');
    const targetProject = projectsRes.body.data[0];
    console.log(`Selected Target Project ID: ${targetProject._id} ("${targetProject.title}")`);

    // 5. Cast Vote
    console.log('\n5. Testing POST /api/votes with Bearer JWT...');
    const votePayload = {
      projectId: targetProject._id,
      rating: 5,
      appreciation: 'Excellent project',
      review: 'Very innovative idea',
      suggestion: 'Add more real-world testing'
    };
    const voteRes = await request('POST', '/api/votes', votePayload, {
      Authorization: `Bearer ${voterToken}`
    });
    console.log(`Status: ${voteRes.status}`, voteRes.body);
    if (voteRes.status !== 201) throw new Error('Cast vote failed');

    // 6. Test Duplicate Vote & Cross-Project Vote Rejection (1 User = 1 Vote Total)
    console.log('\n6. Testing Duplicate Vote POST /api/votes (Same Project)...');
    const duplicateVoteRes = await request('POST', '/api/votes', votePayload, {
      Authorization: `Bearer ${voterToken}`
    });
    console.log(`Status: ${duplicateVoteRes.status}`, duplicateVoteRes.body);
    if (
      duplicateVoteRes.status !== 400 ||
      (!duplicateVoteRes.body.message.includes('already') && !duplicateVoteRes.body.message.includes('1 vote'))
    ) {
      throw new Error('Duplicate vote prevention test failed!');
    }
    console.log('✓ SUCCESS: Session single vote enforcement properly rejected second vote!');

    if (projectsRes.body.data.length > 1) {
      const secondProject = projectsRes.body.data[1];
      console.log(`\n6b. Testing Cross-Project Vote Rejection POST /api/votes (Project #${secondProject.team} - "${secondProject.title}")...`);
      const secondVoteRes = await request('POST', '/api/votes', {
        projectId: secondProject._id,
        rating: 4,
        appreciation: 'Nice work'
      }, {
        Authorization: `Bearer ${voterToken}`
      });
      console.log(`Status: ${secondVoteRes.status}`, secondVoteRes.body);
      if (secondVoteRes.status !== 400 || !secondVoteRes.body.message.includes('1 vote')) {
        throw new Error('Cross-project vote rejection test failed!');
      }
      console.log('✓ SUCCESS: 1 User 1 Session Vote limit enforced across different projects!');

      console.log(`\n6c. Testing Feedback on Second Project (Project #${secondProject.team})...`);
      const secondFeedbackRes = await request('POST', '/api/feedback', {
        projectId: secondProject._id,
        rating: 5,
        message: 'Feedback for second project without official vote'
      }, {
        Authorization: `Bearer ${voterToken}`
      });
      console.log(`Status: ${secondFeedbackRes.status}`, secondFeedbackRes.body);
      if (secondFeedbackRes.status !== 201) throw new Error('Multi-project feedback failed');
      console.log('✓ SUCCESS: User allowed to give feedback on other projects!');
    }

    // 7. Feedback
    console.log('\n7. Testing POST /api/feedback on first project with Bearer JWT...');
    const feedbackPayload = {
      projectId: targetProject._id,
      rating: 5,
      message: 'The project was very easy to understand.'
    };
    const feedbackRes = await request('POST', '/api/feedback', feedbackPayload, {
      Authorization: `Bearer ${voterToken}`
    });
    console.log(`Status: ${feedbackRes.status}`, feedbackRes.body);
    if (feedbackRes.status !== 201) throw new Error('Feedback submit failed');

    // 7b. Check My Vote endpoint
    console.log('\n7b. Testing GET /api/votes/my-vote...');
    const myVoteRes = await request('GET', '/api/votes/my-vote', null, {
      Authorization: `Bearer ${voterToken}`
    });
    console.log(`Status: ${myVoteRes.status}`, `hasVoted: ${myVoteRes.body.hasVoted}`);
    if (myVoteRes.status !== 200 || !myVoteRes.body.hasVoted) throw new Error('Get my vote failed');
    console.log('✓ SUCCESS: GET /api/votes/my-vote correctly returned user vote.');

    // 8. Results API
    console.log('\n8. Testing GET /api/results...');
    const resultsRes = await request('GET', '/api/results');
    console.log(`Status: ${resultsRes.status}`, resultsRes.body.stats);
    console.log('Top 3 Podium:', resultsRes.body.top3.map(t => `#${t.rank} ${t.title} (${t.votes} votes)`));
    if (resultsRes.status !== 200) throw new Error('Results API failed');

    console.log('\n======================================================');
    console.log('🎉 ALL 8 MONGODB & API VERIFICATION TESTS PASSED 100%');
    console.log('======================================================');
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exit(1);
  } finally {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {});
    }
    if (serverStarted) {
      server.close();
    }
    process.exit(0);
  }
}

runTests();
