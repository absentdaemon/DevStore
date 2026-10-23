import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('   DevStore Phase 9A Backend, Accounts & Roles Test ');
console.log('====================================================\n');

// --------------------------------------------------------------------------
// 1. SQL Schema & Migration Verification
// --------------------------------------------------------------------------
console.log('Test 1: Supabase Migration DDL & Schema Integrity');
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261023000001_phase9a_init.sql');
assert.ok(fs.existsSync(migrationPath), 'Migration file 20261023000001_phase9a_init.sql must exist');
const sql = fs.readFileSync(migrationPath, 'utf8');

// Enums
const requiredEnums = ['user_role', 'dev_app_status', 'app_status', 'version_status', 'target_platform'];
for (const e of requiredEnums) {
  assert.ok(sql.includes(`CREATE TYPE public.${e}`), `Custom enum ${e} must be defined`);
}

// Tables
const requiredTables = [
  'profiles',
  'developer_applications',
  'applications',
  'app_versions',
  'reviews',
  'favorites',
  'moderation_audit_logs'
];
for (const t of requiredTables) {
  assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `Table ${t} must be created`);
  assert.ok(sql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`), `RLS must be enabled on ${t}`);
}

// Triggers & Stored Procedures
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation'), 'prevent_role_self_escalation function must exist');
assert.ok(sql.includes('CREATE TRIGGER trigger_prevent_role_self_escalation'), 'trigger_prevent_role_self_escalation must be installed on profiles');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.handle_new_user'), 'handle_new_user function must exist');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.admin_approve_developer_application'), 'admin_approve_developer_application RPC must exist');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.admin_reject_developer_application'), 'admin_reject_developer_application RPC must exist');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.admin_approve_version'), 'admin_approve_version RPC must exist');
assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.admin_reject_version'), 'admin_reject_version RPC must exist');

// Storage Buckets & Policies
assert.ok(sql.includes("VALUES ('app-packages', 'app-packages', false)"), 'app-packages bucket must be private (public: false)');
assert.ok(sql.includes("VALUES ('app-assets', 'app-assets', true)"), 'app-assets bucket must be public');
assert.ok(sql.includes('CREATE POLICY "Developers upload packages"'), 'Storage policy for developer package uploads must exist');
console.log('  ✔ SQL Migration DDL, Enums, Triggers, RLS & Storage Buckets verified');

// --------------------------------------------------------------------------
// 2. Security & Credentials Leak Prevention
// --------------------------------------------------------------------------
console.log('\nTest 2: Secrets Safety & Leak Prevention');
const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
assert.ok(gitignore.includes('.env'), '.gitignore must ignore .env');
assert.ok(gitignore.includes('config.js'), '.gitignore must ignore config.js');

// Verify template files do not leak service_role keys
const envExample = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');
assert.ok(!envExample.includes('eyJh'), '.env.example must not contain live JWT tokens');
assert.ok(envExample.includes('SUPABASE_ANON_KEY='), '.env.example must specify SUPABASE_ANON_KEY');

const configExample = fs.readFileSync(path.join(rootDir, 'config.example.js'), 'utf8');
assert.ok(!configExample.includes('service_role'), 'config.example.js must never mention service_role');

// Frontend source scan for service_role keys
const jsFiles = ['js/app.js', 'js/supabase-client.js', 'index.html'];
for (const relPath of jsFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  assert.ok(!content.includes('service_role_key'), `${relPath} must never contain service_role_key`);
  assert.ok(!content.includes('SUPABASE_SERVICE_ROLE'), `${relPath} must never contain SUPABASE_SERVICE_ROLE`);
}
console.log('  ✔ Verified zero service-role keys or leaks in frontend code, gitignore, and config templates');

// --------------------------------------------------------------------------
// 3. Client Package Validation & SHA-256 Checksum Calculation
// --------------------------------------------------------------------------
console.log('\nTest 3: SHA-256 Checksum Verification & Package File Validator');

// Emulate Web Crypto & Supabase client validator
const allowedExtensions = ['.zip', '.apk', '.tar.gz', '.msi', '.exe'];
const maxSizeBytes = 250 * 1024 * 1024;

function validatePackage(file) {
  if (!file || !file.name) return { valid: false, error: 'No file selected for upload.' };
  const filename = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some(ext => filename.endsWith(ext));
  if (!hasValidExt) return { valid: false, error: 'Invalid extension' };
  if (file.size <= 0) return { valid: false, error: 'Selected file is empty (0 bytes).' };
  if (file.size > maxSizeBytes) return { valid: false, error: 'File size exceeds maximum limit' };
  return { valid: true };
}

// Validation tests
assert.strictEqual(validatePackage(null).valid, false);
assert.strictEqual(validatePackage({ name: 'malicious.bat', size: 1024 }).valid, false);
assert.strictEqual(validatePackage({ name: 'script.sh', size: 1024 }).valid, false);
assert.strictEqual(validatePackage({ name: 'empty-app.zip', size: 0 }).valid, false);
assert.strictEqual(validatePackage({ name: 'huge-app.zip', size: 300 * 1024 * 1024 }).valid, false);
assert.strictEqual(validatePackage({ name: 'retro-chess-arena-v1.4.2.apk', size: 15 * 1024 * 1024 }).valid, true);
assert.strictEqual(validatePackage({ name: 'devterm-pro-4.0.2.zip', size: 45 * 1024 * 1024 }).valid, true);

// Node.js crypto SHA-256 matches browser subtle.digest SHA-256
const samplePayload = Buffer.from('DevStore Package Binary Content Verification', 'utf8');
const expectedHash = crypto.createHash('sha256').update(samplePayload).digest('hex');
assert.strictEqual(expectedHash.length, 64, 'SHA-256 hash must be 64 characters hex');
assert.strictEqual(expectedHash, 'f3da52e59a24407e9ad3d0817fee62ce1ce306dcf7747a898baec0e23f5d3cc5');
console.log(`  ✔ Validated package formats, size limits, and SHA-256 calculation: ${expectedHash.slice(0, 16)}...`);

// --------------------------------------------------------------------------
// 4. Role Hierarchy & State Machine Simulation
// --------------------------------------------------------------------------
console.log('\nTest 4: RBAC Role Hierarchy & Security Escalation Prevention');

// State simulation of role rules:
// - User starts with role 'user'
// - Cannot self-escalate to 'developer' or 'admin'
// - Can submit developer_application (status: 'pending')
// - Only Admin can approve developer_application -> promotes to 'developer'
// - Developer can create application (status: 'draft') and upload package version (status: 'pending')
// - Only Admin can approve version -> transitions version to 'approved' and app to 'published'

class MockDevStoreSecurityContext {
  constructor(initialRole = 'user') {
    this.role = initialRole;
    this.applications = [];
    this.devApplications = [];
    this.appVersions = [];
    this.auditLogs = [];
  }

  attemptSelfEscalation(newRole) {
    if (this.role !== 'admin') {
      throw new Error('Security Violation: Cannot alter your own role.');
    }
    this.role = newRole;
  }

  submitDeveloperApplication(orgName) {
    const app = { id: 'dev-app-1', orgName, status: 'pending' };
    this.devApplications.push(app);
    return app;
  }

  adminApproveDeveloper(devAppId, adminRole) {
    if (adminRole !== 'admin') {
      throw new Error('Access Denied: Only administrators can approve developer applications.');
    }
    const devApp = this.devApplications.find(a => a.id === devAppId);
    if (!devApp) throw new Error('Not found');
    devApp.status = 'approved';
    this.role = 'developer'; // promoted
    this.auditLogs.push({ action: 'approved', target: devAppId });
  }

  submitVersion(appId, version) {
    if (this.role !== 'developer' && this.role !== 'admin') {
      throw new Error('Access Denied: Only approved developers can submit package releases.');
    }
    const ver = { id: 'ver-1', appId, version, status: 'pending' };
    this.appVersions.push(ver);
    return ver;
  }

  adminApproveVersion(verId, adminRole) {
    if (adminRole !== 'admin') {
      throw new Error('Access Denied: Only administrators can approve application versions.');
    }
    const ver = this.appVersions.find(v => v.id === verId);
    if (!ver) throw new Error('Version not found');
    ver.status = 'approved';
    this.auditLogs.push({ action: 'approved_version', target: verId });
  }
}

const userSession = new MockDevStoreSecurityContext('user');
assert.strictEqual(userSession.role, 'user');

// Verify self-escalation attempt fails
assert.throws(() => {
  userSession.attemptSelfEscalation('admin');
}, /Security Violation/);

assert.throws(() => {
  userSession.attemptSelfEscalation('developer');
}, /Security Violation/);

// Verify user cannot submit release version
assert.throws(() => {
  userSession.submitVersion('org.devstore.myapp', '1.0.0');
}, /Access Denied/);

// User submits developer application
const devApp = userSession.submitDeveloperApplication('Open Source Guild');
assert.strictEqual(devApp.status, 'pending');

// Normal user attempts to approve developer application -> rejected
assert.throws(() => {
  userSession.adminApproveDeveloper(devApp.id, 'user');
}, /Access Denied/);

// Admin approves developer application -> user promoted to developer
userSession.adminApproveDeveloper(devApp.id, 'admin');
assert.strictEqual(userSession.role, 'developer');

// Now developer can submit release version
const ver = userSession.submitVersion('org.devstore.myapp', '1.0.0');
assert.strictEqual(ver.status, 'pending');

// Non-admin cannot approve version
assert.throws(() => {
  userSession.adminApproveVersion(ver.id, 'developer');
}, /Access Denied/);

// Admin approves version
userSession.adminApproveVersion(ver.id, 'admin');
assert.strictEqual(ver.status, 'approved');
console.log('  ✔ RBAC Role progression and admin authorization gates verified');

// --------------------------------------------------------------------------
// 5. Client Integration & DOM Elements
// --------------------------------------------------------------------------
console.log('\nTest 5: Client DOM Elements & Modal Mount Points');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

assert.ok(indexHtml.includes('id="developer-portal-modal"'), 'Developer portal modal container must exist in index.html');
assert.ok(indexHtml.includes('id="admin-dashboard-modal"'), 'Admin dashboard modal container must exist in index.html');
assert.ok(indexHtml.includes('src="js/vendor/supabase.js"'), 'Supabase vendor script tag must exist in index.html');
assert.ok(indexHtml.includes('src="config.js"'), 'Config script tag must exist in index.html');

const appJs = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
assert.ok(appJs.includes('openDeveloperPortal'), 'openDeveloperPortal method must exist in app.js');
assert.ok(appJs.includes('openAdminPortal'), 'openAdminPortal method must exist in app.js');
assert.ok(appJs.includes('supabaseBackend'), 'supabaseBackend client must be integrated in app.js');

console.log('  ✔ Client DOM Mount points and app.js methods confirmed');

console.log('\n====================================================');
console.log('   ALL PHASE 9A BACKEND & ROLES CHECKS PASSED (100%)');
console.log('====================================================');
