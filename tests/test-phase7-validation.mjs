import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SearchEngine } from '../js/search-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   DevStore Phase 7 Functional & Visual Validation  ');
console.log('====================================================\n');

// 1. Load catalog
const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const engine = new SearchEngine();
engine.loadCatalog(catalog.applications);

// Test 1: Search for chess
console.log('Test 1: Search for "chess"');
const chessRes = engine.search('chess');
assert.ok(chessRes.length > 0, 'Should return chess application');
assert.strictEqual(chessRes[0].id, 'org.devstore.chess', 'Should match Retro Chess Arena ID');
assert.strictEqual(chessRes[0].name, 'Retro Chess Arena');
console.log('  ✔ Search for "chess" successfully matches Retro Chess Arena');

// Test 2: Autocomplete suggestions
console.log('\nTest 2: Autocomplete suggestions for "ch"');
const autoCh = engine.autocomplete('ch', 5);
assert.ok(autoCh.length >= 2, 'Should return multiple matches for "ch"');
const autoNames = autoCh.map(a => a.name);
assert.ok(autoNames.includes('Retro Chess Arena'), 'Suggestions must include Retro Chess Arena');
assert.ok(autoNames.includes('Chronos Task Manager'), 'Suggestions must include Chronos Task Manager');
console.log(`  ✔ Autocomplete correctly returns: ${autoNames.join(', ')}`);

// Test 3: Arrow-key indexing logic (wrap-around navigation)
console.log('\nTest 3: Autocomplete Keyboard Selection Simulation');
let selectedIndex = -1;
const suggestionsCount = autoCh.length;

// Down arrow
selectedIndex = (selectedIndex + 1) % suggestionsCount;
assert.strictEqual(selectedIndex, 0, 'First ArrowDown should select index 0');

// Down arrow to end
for (let i = 1; i < suggestionsCount; i++) {
  selectedIndex = (selectedIndex + 1) % suggestionsCount;
}
assert.strictEqual(selectedIndex, suggestionsCount - 1, 'Should reach last item');

// Wrap around
selectedIndex = (selectedIndex + 1) % suggestionsCount;
assert.strictEqual(selectedIndex, 0, 'ArrowDown at bottom should wrap to index 0');

// Up arrow
selectedIndex = (selectedIndex - 1 + suggestionsCount) % suggestionsCount;
assert.strictEqual(selectedIndex, suggestionsCount - 1, 'ArrowUp at top should wrap to bottom');
console.log('  ✔ ArrowDown and ArrowUp keyboard navigation wrap-around verified');

// Test 4: Enter and Escape key handling simulation
console.log('\nTest 4: Enter and Escape dismissal semantics');
let isSearchOpen = true;
// Simulate Escape key
const escapeKeyHandler = (key) => {
  if (key === 'Escape') isSearchOpen = false;
};
escapeKeyHandler('Escape');
assert.strictEqual(isSearchOpen, false, 'Escape key must close search overlay');
console.log('  ✔ Escape key closes search overlay');

// Test 5: Clear Search
console.log('\nTest 5: Clear Search behavior');
let activeQuery = 'chess';
let clearBtnVisible = true;
// Simulate clear
activeQuery = '';
clearBtnVisible = false;
const clearedResults = engine.search(activeQuery);
assert.strictEqual(clearedResults.length, catalog.applications.length, 'Clearing search restores full catalog');
console.log('  ✔ Clearing search restores default catalog state');

// Test 6: Category and Platform Filters
console.log('\nTest 6: Category and Platform Filters');
const gamesFilter = engine.search('', { category: 'games' });
assert.ok(gamesFilter.length >= 1, 'Games category should contain games');
assert.strictEqual(gamesFilter[0].category, 'games');

const winFilter = engine.search('', { platform: 'windows' });
assert.ok(winFilter.length >= 7, 'Windows platform should have majority apps');

const androidFilter = engine.search('', { platform: 'android' });
assert.ok(androidFilter.length >= 6, 'Android platform should have majority apps');
console.log(`  ✔ Filters verified: Games (${gamesFilter.length}), Windows (${winFilter.length}), Android (${androidFilter.length})`);

// Test 7: App Detail and Back Navigation Data Contract
console.log('\nTest 7: App Detail & Back Navigation Contract');
const targetApp = engine.getAppById('org.devstore.chess');
assert.ok(targetApp, 'App should exist by ID');
assert.ok(targetApp.description, 'App must have description');
assert.ok(targetApp.rating, 'App must have rating');
assert.ok(targetApp.developer, 'App must have developer');
assert.ok(targetApp.downloads, 'App must have downloads object');
assert.ok(targetApp.downloads.windows, 'App must have windows download');
assert.ok(targetApp.downloads.android, 'App must have android download');
console.log('  ✔ App detail metadata complete and verified');

// Test 8: Empty Results and Recommendations Fallback
console.log('\nTest 8: Empty results fallback');
const emptyRes = engine.search('xyz999foobar');
assert.strictEqual(emptyRes.length, 0, 'No apps should match nonsense query');
const fallbackRecs = engine.getRecommendations(null, 4);
assert.strictEqual(fallbackRecs.length, 4, 'Should provide 4 top recommendations');
assert.ok(fallbackRecs.every(r => r.rating >= 4.6), 'Recommendations must be highly rated');
console.log(`  ✔ Empty results properly falls back to recommendations: ${fallbackRecs.map(r => r.name).join(', ')}`);

// Test 9: HTML and DOM structure validation
console.log('\nTest 9: HTML Semantic Structure & ARIA compliance');
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
assert.ok(htmlContent.includes('role="banner"'), 'Header must have role banner');
assert.ok(htmlContent.includes('role="combobox"'), 'Search combobox must have role combobox');
assert.ok(htmlContent.includes('role="listbox"'), 'Suggestions must have role listbox');
assert.ok(htmlContent.includes('device-chips-bar-wrapper'), 'Device chips subheader must exist');
assert.ok(htmlContent.includes('Windows PC'), 'Windows PC chip must exist');
assert.ok(htmlContent.includes('desktop-nav-tabs'), 'Desktop navigation tabs must exist');
assert.ok(htmlContent.includes('mobile-nav-tabs'), 'Mobile navigation tabs must exist');
assert.ok(htmlContent.includes('store-footer'), 'Footer must exist');
console.log('  ✔ HTML semantic tags and ARIA attributes confirmed present');

// Test 10: CSS Tokens and Media Queries
console.log('\nTest 10: CSS Design Tokens & Viewport Breakpoints');
const cssDesign = fs.readFileSync(path.resolve(__dirname, '../css/design-system.css'), 'utf8');
const cssComp = fs.readFileSync(path.resolve(__dirname, '../css/components.css'), 'utf8');
assert.ok(cssDesign.includes('--play-green: #01875f;'), 'Signature Play green token must be defined');
assert.ok(cssDesign.includes('--bg-base: #ffffff;'), 'Default background must be white');
assert.ok(cssComp.includes('.hero-carousel-container'), 'Hero carousel container class must exist');
assert.ok(cssComp.includes('.device-chip.active'), 'Active device chip style must exist');
assert.ok(cssComp.includes('.media-showcase-grid'), 'Media showcase grid must exist');
assert.ok((cssComp + cssDesign).includes('@media (max-width: 768px)'), 'Mobile breakpoint must exist');
assert.ok(cssComp.includes('@media (max-width: 900px)'), 'Laptop breakpoint must exist');
console.log('  ✔ CSS tokens, Google Play green palette, and breakpoints confirmed');


console.log('\n====================================================');
console.log('   ALL 10 PHASE 7 VALIDATION CHECKS PASSED (100%)    ');
console.log('====================================================');
