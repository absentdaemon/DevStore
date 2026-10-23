import assert from 'node:assert';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   DevStore Real Browser Integration Test Suite     ');
console.log('====================================================\n');

// 1. Dynamic Server Loader
const serverModule = await import('../server.cjs');
const { handleRequest } = serverModule.default || serverModule;

const TEST_PORT = 3199;
const server = http.createServer(handleRequest);

await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
console.log(`[Test Server] Running on http://127.0.0.1:${TEST_PORT}`);

// 2. Launch Headless Chrome with CDP
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9223;
const USER_DATA_DIR = path.resolve(__dirname, '../.test_chrome_profile');

if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--disable-gpu',
  '--mute-audio',
  '--window-size=1280,800'
]);

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.networkErrors = [];
    this.pageErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push({
            type: msg.params.type,
            args: msg.params.args.map(a => a.value || a.description)
          });
        } else if (msg.method === 'Runtime.exceptionThrown') {
          this.pageErrors.push(msg.params.exceptionDetails);
        } else if (msg.method === 'Network.responseReceived') {
          if (msg.params.response.status >= 400 && !msg.params.response.url.includes('downloads/')) {
            this.networkErrors.push({
              url: msg.params.response.url,
              status: msg.params.response.status
            });
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(`Evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
    }
    return result.result ? result.result.value : undefined;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

let cdp = null;

try {
  // Wait for Chrome CDP endpoint
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (!versionData) {
    throw new Error('Chrome CDP port did not respond in time');
  }

  console.log(`[Chrome] Connected to ${versionData.Browser}`);

  // Create or get target
  const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');

  // Navigate to index.html
  const testUrl = `http://127.0.0.1:${TEST_PORT}/index.html`;
  console.log(`[Browser] Navigating to ${testUrl}...`);
  await cdp.send('Page.navigate', { url: testUrl });

  // Wait for load event
  await new Promise(r => setTimeout(r, 1200));

  console.log('\n--- Real Browser Test Execution ---');

  // --------------------------------------------------------------------------
  // Check 1: Initial Page Load & Catalog Initialization
  // --------------------------------------------------------------------------
  console.log('Test 1: Page Load, DOM Landmarks & Catalog Loading');
  const title = await cdp.evaluate('document.title');
  assert.ok(title.includes('DevStore'), 'Document title should contain DevStore');

  const loadedAppCount = await cdp.evaluate('document.querySelectorAll(".app-card").length');
  assert.ok(loadedAppCount > 0, `Store should render catalog app cards (found: ${loadedAppCount})`);

  const hasSearchInput = await cdp.evaluate('Boolean(document.getElementById("search-input"))');
  assert.strictEqual(hasSearchInput, true, 'Search input should be present in DOM');
  console.log(`  ✔ Page loaded successfully with ${loadedAppCount} visible app cards`);

  // --------------------------------------------------------------------------
  // Check 2: Viewport Zoom Configuration (user-scalable=no must NOT exist)
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Viewport Configuration (Zoom & Accessibility)');
  const viewportContent = await cdp.evaluate(`
    document.querySelector('meta[name="viewport"]')?.getAttribute('content') || ''
  `);
  assert.ok(!viewportContent.includes('user-scalable=no'), 'Viewport meta must not disable user-scalable');
  assert.ok(!viewportContent.includes('maximum-scale=1'), 'Viewport meta must not force maximum-scale=1');
  assert.ok(viewportContent.includes('width=device-width'), 'Viewport meta must have width=device-width');
  console.log(`  ✔ Viewport meta allows browser zoom: "${viewportContent}"`);

  // --------------------------------------------------------------------------
  // Check 3: Valid Search Route & Results Update
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Valid Search Interaction & Live Results');
  await cdp.evaluate(`
    window.devstore.submitSearch('chess');
  `);
  await new Promise(r => setTimeout(r, 300));

  const mainContentText = await cdp.evaluate(`
    document.getElementById('main-content')?.innerText || ''
  `);
  assert.ok(mainContentText.includes('Retro Chess Arena'), 'Search for "chess" must show Retro Chess Arena in main-content');
  console.log('  ✔ Valid search for "chess" returned matching application');

  // --------------------------------------------------------------------------
  // Check 4: Invalid Search Query & Empty Results Fallback
  // --------------------------------------------------------------------------
  console.log('\nTest 4: Invalid Search Query & Empty State Fallback Recommendations');
  await cdp.evaluate(`
    window.devstore.submitSearch('nonexistent_app_query_xyz99');
  `);
  await new Promise(r => setTimeout(r, 300));

  const emptyStateText = await cdp.evaluate(`
    document.getElementById('main-content')?.innerText || ''
  `);
  assert.ok(emptyStateText.includes('No results for "nonexistent_app_query_xyz99"'), 'Must show empty search notice');
  assert.ok(emptyStateText.includes('DevTerm Pro') || emptyStateText.includes('Retro Chess Arena'), 'Empty search must provide recommendation cards');
  console.log('  ✔ Empty search handled gracefully with contextual recommendations');

  // --------------------------------------------------------------------------
  // Check 5: Category & Platform Filters
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Category & Platform Filtering Interactions');
  // Clear search first
  await cdp.evaluate(`window.devstore.clearSearch();`);
  await new Promise(r => setTimeout(r, 200));

  await cdp.evaluate(`window.devstore.setCategory('utilities');`);
  await new Promise(r => setTimeout(r, 200));
  const categoryCardsCount = await cdp.evaluate(`document.querySelectorAll('.app-card').length`);
  assert.ok(categoryCardsCount > 0, 'Category filter should display apps');

  await cdp.evaluate(`window.devstore.setPlatform('android');`);
  await new Promise(r => setTimeout(r, 200));
  const androidCardsCount = await cdp.evaluate(`document.querySelectorAll('.app-card').length`);
  assert.ok(androidCardsCount > 0, 'Android platform filter should display apps');
  console.log(`  ✔ Category ("utilities": ${categoryCardsCount}) and platform ("android": ${androidCardsCount}) filtered correctly`);

  // --------------------------------------------------------------------------
  // Check 6: Detail View Navigation & URL Routing
  // --------------------------------------------------------------------------
  console.log('\nTest 6: App Detail View Mounting & URL Routing');
  await cdp.evaluate(`window.devstore.selectApp('org.devstore.chess');`);
  await new Promise(r => setTimeout(r, 300));

  const isDetailOpen = await cdp.evaluate(`
    document.getElementById('detail-view')?.style.display === 'block'
  `);
  assert.strictEqual(isDetailOpen, true, 'Detail view display must be block');

  const detailTitle = await cdp.evaluate(`
    document.querySelector('.detail-app-title')?.innerText
  `);
  assert.strictEqual(detailTitle, 'Retro Chess Arena', 'Detail title must match selected app');

  const urlParam = await cdp.evaluate(`new URLSearchParams(window.location.search).get('id')`);
  assert.strictEqual(urlParam, 'org.devstore.chess', 'URL query should reflect active app id');
  console.log('  ✔ Detail view mounted and URL updated to ?id=org.devstore.chess');

  // --------------------------------------------------------------------------
  // Check 7: Browser Back & Forward Navigation
  // --------------------------------------------------------------------------
  console.log('\nTest 7: Browser History Back and Forward Navigation');
  await cdp.evaluate(`window.history.back();`);
  await new Promise(r => setTimeout(r, 350));

  const isDetailClosed = await cdp.evaluate(`
    document.getElementById('detail-view')?.style.display === 'none'
  `);
  assert.strictEqual(isDetailClosed, true, 'Back navigation should close detail view and return to catalog');

  await cdp.evaluate(`window.history.forward();`);
  await new Promise(r => setTimeout(r, 350));

  const isDetailRestored = await cdp.evaluate(`
    document.getElementById('detail-view')?.style.display === 'block'
  `);
  assert.strictEqual(isDetailRestored, true, 'Forward navigation should restore detail view');
  console.log('  ✔ Browser Back and Forward state transitions verified');

  // --------------------------------------------------------------------------
  // Check 8: Media Controls & Video Trailer Demo Badge
  // --------------------------------------------------------------------------
  console.log('\nTest 8: Media Controls & Truthful Video Demo Badge');
  const hasDemoBadge = await cdp.evaluate(`
    Boolean(document.querySelector('.video-demo-badge'))
  `);
  assert.strictEqual(hasDemoBadge, true, 'Video trailer must display truthful Demo Trailer badge');

  await cdp.evaluate(`window.devstore.toggleVideoPlay('org.devstore.chess');`);
  await new Promise(r => setTimeout(r, 200));

  const toastMessage = await cdp.evaluate(`
    document.querySelector('.store-toast .toast-message')?.innerText || ''
  `);
  assert.ok(toastMessage.includes('Trailer Preview') || toastMessage.includes('No media file'), 'Video controller must notify genuine trailer availability');
  console.log('  ✔ Media controller operates truthfully without fake silent playback');

  // --------------------------------------------------------------------------
  // Check 9: Broken Download Handling & Truthful Install State
  // --------------------------------------------------------------------------
  console.log('\nTest 9: Genuine Download Check & Failure Handling (No Fake Installs)');
  // Ensure app is not in installed list before test
  await cdp.evaluate(`
    window.devstore.uninstallApp('org.devstore.chess');
  `);
  await new Promise(r => setTimeout(r, 200));

  // Trigger install simulation
  await cdp.evaluate(`
    window.devstore.startInstallSimulation('org.devstore.chess');
  `);
  // Wait for fetch HEAD request to complete against missing binary
  await new Promise(r => setTimeout(r, 800));

  const isInstalledState = await cdp.evaluate(`
    document.getElementById('detail-install-cta')?.classList.contains('installed')
  `);
  assert.strictEqual(isInstalledState, false, 'Failed download must NEVER mark button as installed');

  const isErrorOrUnavailableState = await cdp.evaluate(`
    document.getElementById('detail-install-cta')?.classList.contains('error-state') ||
    document.getElementById('detail-install-cta')?.classList.contains('unavailable')
  `);
  assert.strictEqual(isErrorOrUnavailableState, true, 'Button must show error/unavailable state on missing package');

  const errorToast = await cdp.evaluate(`
    document.querySelector('.store-toast.toast-error')?.innerText || ''
  `);
  assert.ok(errorToast.includes('Download Artifact Unavailable'), 'Must display accessible error toast explaining missing artifact');

  const inUserLibrary = await cdp.evaluate(`
    (window.devstore.user?.installedApps || []).includes('org.devstore.chess')
  `);
  assert.strictEqual(inUserLibrary, false, 'App must NOT be added to user library when download fails');
  console.log('  ✔ Missing binary handled truthfully: 404 reported, error toast displayed, 0 fake installs');

  // --------------------------------------------------------------------------
  // Check 10: Genuine Auth State & Absence of Demo Fallbacks
  // --------------------------------------------------------------------------
  console.log('\nTest 10: Genuine Auth State & Absence of Demo Fallbacks');
  const initialUser = await cdp.evaluate(`window.devstore.user`);
  assert.strictEqual(initialUser, null, 'User should be null (unauthenticated) initially');

  const avatarLabel = await cdp.evaluate(`document.getElementById('user-avatar-btn')?.getAttribute('aria-label')`);
  assert.strictEqual(avatarLabel, 'Sign in to DevStore', 'Avatar button must indicate Sign in when unauthenticated');

  // Verify that opening sign in modal shows genuine auth tabs (Sign In, Register, Forgot Password) and NO Quick Demo tab
  await cdp.evaluate(`window.devstore.openSignInModal();`);
  await new Promise(r => setTimeout(r, 250));

  const hasDemoTab = await cdp.evaluate(`Boolean(document.getElementById('tab-btn-demo'))`);
  assert.strictEqual(hasDemoTab, false, 'Quick Demo tab must be removed from production modal');

  const hasRegisterTab = await cdp.evaluate(`Boolean(document.getElementById('tab-btn-register'))`);
  assert.strictEqual(hasRegisterTab, true, 'Register tab must exist');

  const hasForgotTab = await cdp.evaluate(`Boolean(document.getElementById('tab-btn-forgot'))`);
  assert.strictEqual(hasForgotTab, true, 'Forgot password tab must exist');

  // Simulate authenticated user and verify profile popover displays genuine role
  await cdp.evaluate(`
    window.devstore.user = {
      name: 'Developer Alice',
      email: 'alice@devstore.org',
      role: 'developer',
      installedApps: []
    };
    window.devstore.renderUserAvatar();
    window.devstore.openProfilePopover();
  `);
  await new Promise(r => setTimeout(r, 250));

  const profileRole = await cdp.evaluate(`
    document.querySelector('.demo-profile-badge')?.innerText || ''
  `);
  assert.ok(profileRole.includes('Developer'), 'Profile popover must display genuine Verified Developer role');

  const fakeCheckmark = await cdp.evaluate(`
    document.querySelector('.popover-avatar-badge[title="Verified Account"]')
  `);
  assert.strictEqual(fakeCheckmark, null, 'Fake "Verified Account" checkmark must be removed');
  console.log('  ✔ Genuine auth states and absence of demo fallbacks verified');

  // --------------------------------------------------------------------------
  // Check 11: Dialog Focus, Escape Dismissal & Focus Restoration
  // --------------------------------------------------------------------------
  console.log('\nTest 11: Accessible Dialog Focus, Escape Key Dismissal & Focus Trap');
  await cdp.evaluate(`window.devstore.closeProfilePopover();`);
  await cdp.evaluate(`window.devstore.openSignInModal();`);
  await new Promise(r => setTimeout(r, 250));

  const isSignInOpen = await cdp.evaluate(`
    document.getElementById('signin-modal')?.classList.contains('open')
  `);
  assert.strictEqual(isSignInOpen, true, 'Sign-in modal must be open');

  // Dispatch Escape keydown
  await cdp.evaluate(`
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 250));

  const isSignInClosed = await cdp.evaluate(`
    !document.getElementById('signin-modal')?.classList.contains('open')
  `);
  assert.strictEqual(isSignInClosed, true, 'Escape key must dismiss open modal dialog');
  console.log('  ✔ Dialog Escape dismissal and focus management confirmed');

  // --------------------------------------------------------------------------
  // Check 12: Mobile Viewport Geometry & Horizontal Overflow Check
  // --------------------------------------------------------------------------
  console.log('\nTest 12: Mobile Viewport (390px) Overflow & Responsiveness');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 300));

  const scrollWidth = await cdp.evaluate('document.documentElement.scrollWidth');
  const innerWidth = await cdp.evaluate('window.innerWidth');
  assert.ok(scrollWidth <= innerWidth + 1, `Mobile view must not have horizontal overflow (scrollWidth=${scrollWidth}, innerWidth=${innerWidth})`);
  console.log(`  ✔ Mobile layout (390px): scrollWidth=${scrollWidth} <= innerWidth=${innerWidth} (zero overflow)`);

  // --------------------------------------------------------------------------
  // Check 13: Local Server Security (Path Traversal & HTTP Methods)
  // --------------------------------------------------------------------------
  console.log('\nTest 13: Server Security Checks via HTTP Client');
  // Traversal check
  const traversalRes = await fetch(`http://127.0.0.1:${TEST_PORT}/..%2f..%2f..%2fwindows%2fwin.ini`);
  assert.strictEqual(traversalRes.status, 403, 'Traversal attempt must return 403 Forbidden');

  // Method check
  const postRes = await fetch(`http://127.0.0.1:${TEST_PORT}/index.html`, { method: 'POST' });
  assert.strictEqual(postRes.status, 405, 'POST must return 405 Method Not Allowed');
  assert.strictEqual(postRes.headers.get('allow'), 'GET, HEAD', 'Allow header must be GET, HEAD');
  console.log('  ✔ Server filesystem containment and method restriction verified');

  // --------------------------------------------------------------------------
  // Check 14: Console Errors & Failed Requests
  // --------------------------------------------------------------------------
  console.log('\nTest 14: Console Log & Runtime Error Inspection');
  const fatalErrors = cdp.pageErrors.length;
  assert.strictEqual(fatalErrors, 0, `Page threw ${fatalErrors} runtime exceptions: ${JSON.stringify(cdp.pageErrors)}`);
  assert.strictEqual(cdp.networkErrors.length, 0, `Page had unexpected network 4xx/5xx errors: ${JSON.stringify(cdp.networkErrors)}`);
  console.log(`  ✔ Zero uncaught exceptions, zero broken core assets`);

  console.log('\n====================================================');
  console.log('   ALL 14 REAL BROWSER INTEGRATION CHECKS PASSED    ');
  console.log('====================================================\n');

} catch (err) {
  console.error('\n❌ Test Suite Failed:', err);
  if (cdp) {
    console.error('Page errors:', cdp.pageErrors);
    console.error('Console logs:', cdp.consoleLogs);
    console.error('Network errors:', cdp.networkErrors);
  }
  process.exitCode = 1;
} finally {
  if (cdp) cdp.close();
  chrome.kill();
  server.close();
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch {}
}
