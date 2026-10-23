import assert from 'node:assert';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { server, BASE_DIR } = require('../server.cjs');

console.log('====================================================');
console.log('   DevStore Server Security & Correctness Tests     ');
console.log('====================================================\n');

const TEST_PORT = 3847;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));

  try {
    // 1. Path traversal tests
    console.log('Check 1: Filesystem Containment & Traversal Rejection');

    const t1 = await makeRequest('/../package.json');
    assert.strictEqual(t1.statusCode, 403, 'Should reject dot-dot slash path with 403');

    const t2 = await makeRequest('/%2e%2e/server.cjs');
    assert.strictEqual(t2.statusCode, 403, 'Should reject URL-encoded dot-dot with 403');

    const t3 = await makeRequest('/..%2fserver.cjs');
    assert.strictEqual(t3.statusCode, 403, 'Should reject encoded slash traversal with 403');

    const t4 = await makeRequest('/index.html%00.png');
    assert.strictEqual(t4.statusCode, 400, 'Should reject null byte injection with 400');

    const t5 = await makeRequest('/%c0%afindex.html');
    assert.strictEqual(t5.statusCode, 400, 'Should reject malformed URI encoding with 400');

    console.log('  ✔ All traversal and poison byte attempts safely rejected (403/400)');

    // 2. HTTP method restrictions
    console.log('\nCheck 2: HTTP Method Filtering');

    const postRes = await makeRequest('/index.html', { method: 'POST', body: '{"hack":true}' });
    assert.strictEqual(postRes.statusCode, 405, 'POST must return 405 Method Not Allowed');
    assert.ok(postRes.headers['allow'] && postRes.headers['allow'].includes('GET'), 'Must include Allow header');

    const putRes = await makeRequest('/index.html', { method: 'PUT', body: 'data' });
    assert.strictEqual(putRes.statusCode, 405, 'PUT must return 405 Method Not Allowed');

    const delRes = await makeRequest('/index.html', { method: 'DELETE' });
    assert.strictEqual(delRes.statusCode, 405, 'DELETE must return 405 Method Not Allowed');

    console.log('  ✔ Unsupported methods POST, PUT, DELETE return 405 with Allow header');

    // 3. Supported methods (GET, HEAD)
    console.log('\nCheck 3: Supported HTTP Methods (GET, HEAD) & Static File Serving');

    const getRes = await makeRequest('/index.html', { method: 'GET' });
    assert.strictEqual(getRes.statusCode, 200, 'GET /index.html must return 200');
    assert.ok(getRes.headers['content-type'].includes('text/html'), 'Must serve correct content-type');
    assert.ok(getRes.body.includes('DevStore'), 'Body must contain index.html content');

    const headRes = await makeRequest('/index.html', { method: 'HEAD' });
    assert.strictEqual(headRes.statusCode, 200, 'HEAD /index.html must return 200');
    assert.strictEqual(headRes.body, '', 'HEAD request must have empty body');
    assert.ok(headRes.headers['content-length'], 'HEAD request must have Content-Length');

    const notFound = await makeRequest('/nonexistent-test-file-999.xyz');
    assert.strictEqual(notFound.statusCode, 404, 'Non-existent file must return 404');

    console.log('  ✔ GET and HEAD work as expected and missing files return 404');

    // 4. CORS header review
    console.log('\nCheck 4: CORS Header Review');
    assert.strictEqual(getRes.headers['access-control-allow-origin'], undefined, 'Permissive wildcard CORS must NOT be present');
    console.log('  ✔ Permissive Access-Control-Allow-Origin: * has been removed');

    console.log('\n====================================================');
    console.log('   ALL SERVER SECURITY CHECKS PASSED (100%)         ');
    console.log('====================================================\n');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

runTests().catch((err) => {
  console.error('Server security test failure:', err);
  process.exit(1);
});
