import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SearchEngine } from '../js/search-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   DevStore Phase 8 Comprehensive Parity Validation ');
console.log('====================================================\n');

// 1. Load catalog & SearchEngine
const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const engine = new SearchEngine();
engine.loadCatalog(catalog.applications);

// Check 1: 9-Category Feature Inventory Verification
console.log('Check 1: Catalog Richness & Feature Parity Metadata');
assert.strictEqual(catalog.applications.length, 8, 'Should have 8 full applications');
catalog.applications.forEach(app => {
  assert.ok(app.distribution, `${app.name} must have rating distribution breakdown`);
  assert.strictEqual(typeof app.distribution['5'], 'number', 'Must have 5-star distribution percentage');
  assert.ok(app.video, `${app.name} must have video trailer metadata`);
  assert.ok(app.contentRating, `${app.name} must have content rating`);
  assert.ok(app.support, `${app.name} must have support contact info`);
  assert.ok(app.support.email, `${app.name} must have support email`);
  assert.ok(app.support.privacyPolicy, `${app.name} must have privacy policy`);
  assert.ok(Array.isArray(app.screenshots) && app.screenshots.length >= 2, `${app.name} must have rich screenshots`);
  assert.ok(Array.isArray(app.reviews) && app.reviews.length >= 1, `${app.name} must have reviews`);
});
console.log('  ✔ All 8 applications verified with distribution, video trailer, support, and reviews');

// Check 2: HTML Mount Points & Accessibility ARIA Roles
console.log('\nCheck 2: HTML Semantic Landmarks and Modal Mount Points');
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
assert.ok(html.includes('id="screenshot-lightbox-modal"'), 'Screenshot lightbox container must exist');
assert.ok(html.includes('role="dialog"'), 'Dialog roles must be present');
assert.ok(html.includes('aria-modal="true"'), 'Aria-modal must be true on modals');
assert.ok(html.includes('id="review-modal"'), 'Review modal container must exist');
assert.ok(html.includes('id="signin-modal"'), 'Sign in modal must exist');
assert.ok(html.includes('id="manage-apps-modal"'), 'Manage apps modal must exist');
assert.ok(html.includes('id="profile-popover"'), 'Profile popover container must exist');
assert.ok(html.includes('id="store-main-viewport"'), 'Main store viewport must exist');
console.log('  ✔ Lightbox, review, profile, sign-in, and manage-apps modals confirmed');

// Check 3: CSS Geometry, Design Tokens & Component Styling
console.log('\nCheck 3: CSS Component Geometry & Google Play Stylesheet Rules');
const cssComp = fs.readFileSync(path.resolve(__dirname, '../css/components.css'), 'utf8');
assert.ok(cssComp.includes('.detail-header'), 'Desktop 2-column detail header rule must exist');
assert.ok(cssComp.includes('.lightbox-modal-backdrop'), 'Screenshot lightbox overlay style must exist');
assert.ok(cssComp.includes('.video-preview-card'), 'Video preview card style must exist');
assert.ok(cssComp.includes('.ratings-reviews-section'), 'Ratings and reviews section style must exist');
assert.ok(cssComp.includes('.rating-bars-col'), '5-Star horizontal distribution bars must exist');
assert.ok(cssComp.includes('.review-filter-pill'), 'Device review filter pills must exist');
assert.ok(cssComp.includes('.community-reviews-list'), 'Community review cards list must exist');
assert.ok(cssComp.includes('.detail-install-btn.installing'), 'Animated installing button state must exist');
assert.ok(cssComp.includes('.install-spinner'), 'Circular install spinner animation must exist');
assert.ok(cssComp.includes('.detail-install-btn.installed'), 'Installed open button state must exist');
assert.ok(cssComp.includes('.app-support-details'), 'App support accordion details must exist');
console.log('  ✔ Detail header, Lightbox, Video, Rating bars, Install spinner, and Reviews CSS verified');

// Check 4: App.js Controller Methods Contract
console.log('\nCheck 4: JavaScript Controller Methods Contract');
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf8');
const requiredMethods = [
  'renderDetailView',
  'openScreenshotLightbox',
  'renderLightbox',
  'closeScreenshotLightbox',
  'navigateLightbox',
  'toggleVideoPlay',
  'toggleVideoMute',
  'startInstallSimulation',
  'uninstallApp',
  'filterReviewsByDevice',
  'voteHelpfulReview',
  'toggleAppSupportAccordion',
  'openReviewModal',
  'shareApp',
  'toggleWishlist'
];
requiredMethods.forEach(method => {
  assert.ok(appJs.includes(`${method}(`), `Method ${method} must be implemented in app.js`);
});
console.log(`  ✔ All ${requiredMethods.length} interactive parity methods confirmed in app.js`);

// Check 5: Screenshot Artifacts Existence
console.log('\nCheck 5: Visual Parity Screenshot Artifacts Verification');
const screenshotFiles = [
  'ref-desktop-1440.png',
  'ref-laptop-1280.png',
  'ref-mobile-390.png',
  'ref-narrow-360.png',
  'ref-detail-1440.png',
  'ref-screenshot-lightbox.png',
  'ref-detail-reviews.png',
  'devstore-desktop-1440.png',
  'devstore-laptop-1280.png',
  'devstore-mobile-390.png',
  'devstore-narrow-360.png',
  'devstore-detail-1440.png',
  'devstore-screenshot-lightbox.png',
  'devstore-detail-reviews.png',
  'devstore-video-player.png',
  'devstore-install-progress.png'
];

screenshotFiles.forEach(file => {
  const p = path.resolve(__dirname, '../research/screenshots', file);
  assert.ok(fs.existsSync(p), `Screenshot file ${file} must exist`);
  const stats = fs.statSync(p);
  assert.ok(stats.size > 20000, `Screenshot ${file} must have valid non-empty image size (>20KB), got ${stats.size}`);
});
console.log(`  ✔ All ${screenshotFiles.length} visual parity screenshot evidence files verified on disk`);

console.log('\n====================================================');
console.log('   ALL 5 PHASE 8 PARITY CHECKS PASSED (100%)         ');
console.log('====================================================');
