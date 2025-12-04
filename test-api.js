// test-api.js - Node.js API test script
const https = require('https');
const http = require('http');

const API_BASE = process.env.API_URL || 'http://localhost:3000/api';
const useHttp = API_BASE.startsWith('http://');

console.log('====================================');
console.log('  Track Senpi - API Test');
console.log('====================================');
console.log('Testing:', API_BASE);
console.log('');

const tests = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET'
  },
  {
    name: 'Admin Login',
    path: '/auth/login',
    method: 'POST',
    body: { nrp: '00000001', password: 'admin123' }
  },
  {
    name: 'Get Users',
    path: '/users',
    method: 'GET'
  },
  {
    name: 'Get Senpi',
    path: '/senpi',
    method: 'GET'
  },
  {
    name: 'Get Latest Locations',
    path: '/location/latest',
    method: 'GET'
  }
];

async function runTest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + test.path);
    const options = {
      hostname: url.hostname,
      port: url.port || (useHttp ? 80 : 443),
      path: url.pathname,
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const client = useHttp ? http : https;
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode, data });
        } else {
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (test.body) {
      req.write(JSON.stringify(test.body));
    }

    req.end();
  });
}

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`[${tests.indexOf(test) + 1}/${tests.length}] ${test.name}... `);
    
    try {
      const result = await runTest(test);
      
      if (result.success) {
        console.log('\x1b[32m✓ PASS\x1b[0m', `(${result.status})`);
        passed++;
      } else {
        console.log('\x1b[31m✗ FAIL\x1b[0m', `(${result.status})`);
        console.log('  Response:', result.data.substring(0, 100));
        failed++;
      }
    } catch (error) {
      console.log('\x1b[31m✗ ERROR\x1b[0m');
      console.log('  ', error.message);
      failed++;
    }
  }

  console.log('');
  console.log('====================================');
  console.log('  Results:');
  console.log(`  Passed: ${passed}/${tests.length}`);
  console.log(`  Failed: ${failed}/${tests.length}`);
  console.log('====================================');
  console.log('');

  if (failed > 0) {
    console.log('\x1b[33mNote:\x1b[0m Pastikan backend server running di:', API_BASE.replace('/api', ''));
    console.log('Run: cd backend && npm run dev');
    process.exit(1);
  } else {
    console.log('\x1b[32m✓ All tests passed!\x1b[0m');
    console.log('');
    console.log('Next: Test frontend di browser');
    console.log('1. Open index.html with Live Server');
    console.log('2. Login with NRP: 00000001, Password: admin123');
  }
}

runAllTests().catch(error => {
  console.error('\x1b[31mTest suite error:\x1b[0m', error.message);
  process.exit(1);
});
