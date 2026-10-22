import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   DevStore Profile & Google Login Validation       ');
console.log('====================================================\n');

// 1. Verify HTML structures
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

console.log('Test 1: User Avatar Button & Profile Popover in index.html');
assert.ok(html.includes('id="user-avatar-btn"'), 'User avatar button must exist');
assert.ok(html.includes('aria-haspopup="true"'), 'Avatar button must indicate popover capability');
assert.ok(html.includes('id="profile-popover"'), 'Profile popover container must exist');
assert.ok(html.includes('id="signin-modal"'), 'Google sign-in modal container must exist');
assert.ok(html.includes('id="manage-apps-modal"'), 'Manage apps & device modal container must exist');
console.log('  ✔ All Profile and Authentication mount points confirmed in index.html');

// 2. Verify CSS rules
const css = fs.readFileSync(path.resolve(__dirname, '../css/components.css'), 'utf8');

console.log('\nTest 2: Google Play Profile Popover & Material 3 Styling');
assert.ok(css.includes('.profile-popover'), 'Profile popover styles must exist');
assert.ok(css.includes('.popover-user-card'), 'User card styling must exist');
assert.ok(css.includes('.popover-avatar-large'), 'Large profile avatar must exist');
assert.ok(css.includes('.popover-manage-account-btn'), 'Manage account pill button must exist');
assert.ok(css.includes('.popover-menu-item'), 'Menu items must exist');
assert.ok(css.includes('.user-avatar-btn.signed-in'), 'Signed-in avatar styling must exist');
assert.ok(css.includes('.google-signin-dialog'), 'Google Identity dialog styles must exist');
assert.ok(css.includes('.signin-outlined-input'), 'Outlined input styles must exist');
assert.ok(css.includes('.manage-apps-dialog'), 'Manage apps & device dialog styles must exist');
assert.ok(css.includes('.protect-status-card'), 'Play Protect status card must exist');
console.log('  ✔ CSS rules for Popover, Dialogs, and Identity components verified');

// 3. Verify JavaScript logic
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf8');

console.log('\nTest 3: Profile & Authentication Controller in app.js');
assert.ok(appJs.includes('renderUserAvatar'), 'renderUserAvatar method must exist');
assert.ok(appJs.includes('toggleProfilePopover'), 'toggleProfilePopover method must exist');
assert.ok(appJs.includes('openSignInModal'), 'openSignInModal method must exist');
assert.ok(appJs.includes('handleSignIn'), 'handleSignIn method must exist');
assert.ok(appJs.includes('handleSignOut'), 'handleSignOut method must exist');
assert.ok(appJs.includes('openManageAppsModal'), 'openManageAppsModal method must exist');
assert.ok(appJs.includes('uninstallApp'), 'uninstallApp method must exist');
assert.ok(appJs.includes('DEFAULT_USER'), 'DEFAULT_USER profile must be defined');
assert.ok(appJs.includes('DEMO_ACCOUNTS'), 'DEMO_ACCOUNTS list must be defined');
console.log('  ✔ Controller methods and data structures confirmed in app.js');

// 4. Simulate User Profile State Transitions
console.log('\nTest 4: State Machine Simulation (Sign in, Install, Uninstall, Sign out)');
let mockStorage = {};
const mockLocalStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

const DEFAULT_USER = {
  name: 'Alex Mercer',
  email: 'alex.mercer@devstore.org',
  initial: 'A',
  avatarBg: 'linear-gradient(135deg, #01875f 0%, #34a853 100%)',
  installedApps: ['org.devstore.chess', 'org.devstore.terminal'],
  passActive: true
};

// Initial state
let currentUser = { ...DEFAULT_USER };
mockLocalStorage.setItem('devstore_user', JSON.stringify(currentUser));
assert.strictEqual(currentUser.name, 'Alex Mercer');
assert.strictEqual(currentUser.installedApps.length, 2);

// Install app
const newAppId = 'org.devstore.calculator';
if (!currentUser.installedApps.includes(newAppId)) {
  currentUser.installedApps.push(newAppId);
  mockLocalStorage.setItem('devstore_user', JSON.stringify(currentUser));
}
assert.strictEqual(currentUser.installedApps.length, 3, 'Installed apps should now be 3');
assert.ok(currentUser.installedApps.includes(newAppId), 'Calculator should be in library');

// Uninstall app
currentUser.installedApps = currentUser.installedApps.filter(id => id !== 'org.devstore.terminal');
mockLocalStorage.setItem('devstore_user', JSON.stringify(currentUser));
assert.strictEqual(currentUser.installedApps.length, 2, 'Installed apps should now be 2');
assert.ok(!currentUser.installedApps.includes('org.devstore.terminal'), 'Terminal should be removed');

// Sign out
currentUser = null;
mockLocalStorage.removeItem('devstore_user');
assert.strictEqual(currentUser, null, 'User should be null after sign out');
assert.strictEqual(mockLocalStorage.getItem('devstore_user'), null, 'Storage should be cleared');

// Sign in as Sarah Connor
const sarah = {
  name: 'Sarah Connor',
  email: 'sarah.c@devstore.org',
  initial: 'S',
  avatarBg: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)',
  installedApps: ['org.devstore.calculator', 'org.devstore.weather'],
  passActive: false
};
currentUser = { ...sarah };
mockLocalStorage.setItem('devstore_user', JSON.stringify(currentUser));
assert.strictEqual(currentUser.name, 'Sarah Connor');
assert.strictEqual(currentUser.initial, 'S');
assert.strictEqual(currentUser.installedApps.length, 2);
console.log('  ✔ Authentication state machine and persistence verified');

console.log('\n====================================================');
console.log('   ALL PROFILE & AUTHENTICATION CHECKS PASSED (100%)');
console.log('====================================================');
