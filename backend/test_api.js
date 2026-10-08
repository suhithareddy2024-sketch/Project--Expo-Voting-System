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

    // 6. Test Duplicate Vote (1 User, 1 Vote Rule)
    console.log('\n6. Testing Duplicate Vote POST /api/votes (Same User + Same Project)...');
    const duplicateVoteRes = await request('POST', '/api/votes', votePayload, {
      Authorization: `Bearer ${voterToken}`
    });
    console.log(`Status: ${duplicateVoteRes.status}`, duplicateVoteRes.body);
    if (
      duplicateVoteRes.status !== 400 ||
      duplicateVoteRes.body.message !== 'You have already voted for this project.'
    ) {
      throw new Error('Duplicate vote prevention test failed!');
    }
    console.log('✓ SUCCESS: Compound unique index { userId: 1, projectId: 1 } properly rejected duplicate vote!');

    // 7. Feedback
    console.log('\n7. Testing POST /api/feedback with Bearer JWT...');
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
  }
}

runTests();
