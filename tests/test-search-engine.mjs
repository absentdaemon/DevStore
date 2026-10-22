import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SearchEngine } from '../js/search-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const catalogRaw = fs.readFileSync(catalogPath, 'utf8');
const catalogData = JSON.parse(catalogRaw);

const engine = new SearchEngine();
engine.loadCatalog(catalogData.applications);

console.log('--- Running DevStore Search Engine Tests ---');

// Test 1: Catalog Loaded
assert.strictEqual(catalogData.applications.length, 8, 'Catalog should have 8 applications');
console.log('✔ Test 1: Catalog loaded with 8 applications');

// Test 2: Search for "chess"
const chessResults = engine.search('chess');
assert.ok(chessResults.length >= 1, 'Search for "chess" should return at least 1 result');
assert.strictEqual(chessResults[0].id, 'org.devstore.chess', 'Top result should be Retro Chess Arena');
console.log(`✔ Test 2: Search for "chess" returned: ${chessResults[0].name}`);

// Test 3: Autocomplete for "ch"
const chSuggestions = engine.getSuggestions('ch', 5);
assert.ok(chSuggestions.length >= 2, 'Autocomplete for "ch" should return at least 2 items');
const names = chSuggestions.map(s => s.name);
assert.ok(names.includes('Retro Chess Arena'), 'Should suggest Retro Chess Arena');
assert.ok(names.includes('Chronos Task Manager'), 'Should suggest Chronos Task Manager');
console.log(`✔ Test 3: Autocomplete for "ch" returned: ${names.join(', ')}`);

// Test 4: Unknown Query Returns Zero Matches
const unknownResults = engine.search('nonexistentquery123');
assert.strictEqual(unknownResults.length, 0, 'Unknown query should return 0 results');
console.log('✔ Test 4: Unknown query returned 0 results as expected');

// Test 5: Recommendations Fallback
const recs = engine.getRecommendations(null, 4);
assert.strictEqual(recs.length, 4, 'Recommendations should return 4 apps');
assert.ok(recs[0].rating >= 4.8, 'Top recommendation should have high rating');
console.log(`✔ Test 5: Recommendations returned: ${recs.map(r => r.name).join(', ')}`);

// Test 6: Category Filter
const utilResults = engine.search('', { category: 'utilities' });
assert.ok(utilResults.length >= 2, 'Utilities category should contain apps');
for (const app of utilResults) {
  assert.strictEqual(app.category, 'utilities', `App ${app.name} should belong to utilities`);
}
console.log(`✔ Test 6: Category filter "utilities" returned ${utilResults.length} apps`);

// Test 7: Platform Filter
const androidResults = engine.search('', { platform: 'android' });
assert.ok(androidResults.length >= 5, 'Android platform filter should return apps');
for (const app of androidResults) {
  assert.ok(app.platforms.includes('android'), `App ${app.name} should support android`);
}
console.log(`✔ Test 7: Platform filter "android" returned ${androidResults.length} apps`);

console.log('--- ALL 7 SEARCH ENGINE UNIT TESTS PASSED ---');
