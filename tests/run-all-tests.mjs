import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const testSuites = [
  { name: 'Phase 8 Parity Validation', script: 'tests/test-parity-phase8.mjs' },
  { name: 'Profile & Auth State Machine', script: 'tests/test-profile-auth.mjs' },
  { name: 'Phase 7 Functional Validation', script: 'tests/test-phase7-validation.mjs' },
  { name: 'Search Engine Unit Tests', script: 'tests/test-search-engine.mjs' },
  { name: 'Server Security & HTTP Hardening', script: 'tests/test-server-security.mjs' },
  { name: 'Catalog Download & Assets Audit', script: 'tests/validate-downloads.mjs' },
  { name: 'Real Headless Chrome Browser Integration', script: 'tests/test-browser-integration.mjs' }
];

console.log('====================================================');
console.log('   DevStore Complete Test Suite Execution          ');
console.log('====================================================\n');

let allPassed = true;
const results = [];

for (const suite of testSuites) {
  console.log(`▶ Running ${suite.name} (${suite.script})...`);
  const start = Date.now();
  const run = spawnSync('node', [suite.script], {
    cwd: projectRoot,
    stdio: 'inherit'
  });
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  if (run.status === 0) {
    console.log(`✔ ${suite.name} PASSED (${duration}s)\n`);
    results.push({ name: suite.name, status: 'PASSED', duration });
  } else {
    console.error(`❌ ${suite.name} FAILED with exit code ${run.status} (${duration}s)\n`);
    results.push({ name: suite.name, status: 'FAILED', duration });
    allPassed = false;
  }
}

console.log('====================================================');
console.log('   Test Execution Summary                           ');
console.log('====================================================');
results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✔' : '❌';
  console.log(`${icon} ${r.name.padEnd(42)} [${r.status}] (${r.duration}s)`);
});
console.log('====================================================');

if (!allPassed) {
  console.error('\nOne or more test suites failed.');
  process.exit(1);
} else {
  console.log('\nAll 7 test suites passed successfully with 100% integrity!');
}
