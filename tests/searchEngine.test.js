var assert = require('assert');
var search = require('../client/search/searchEngine');

var ranked = [
  { id: 'tag', name: 'Directional Blur', tags: ['sh'] },
  { id: 'substring', name: 'Flashing Controls' },
  { id: 'word', name: 'Camera Shake' },
  { id: 'prefix', name: 'Shake Pro' },
  { id: 'exact', name: 'shake' },
  { id: 'alias', name: 'Handheld Motion', aliases: ['shake'] }
];
var results = search.search(ranked, 'sh');
assert.deepStrictEqual(results.slice(0, 4).map(function (match) { return match.item.id; }), ['shake', 'Shake Pro', 'Camera Shake', 'Flashing Controls'].map(function (name) {
  return ranked.filter(function (item) { return item.name.toLowerCase() === name.toLowerCase(); })[0].id;
}));
assert.strictEqual(results[0].matchField, 'name-prefix');
assert.strictEqual(results[1].matchField, 'name-prefix');
assert.strictEqual(results[2].matchField, 'name-word-start');
assert.strictEqual(results[3].matchField, 'name-contains');
assert.strictEqual(results[4].matchField, 'alias-prefix');
assert.strictEqual(results[5].matchField, 'tag-exact');

var substringCoverage = [
  { id: 'beginning', name: 'Shake' },
  { id: 'beginning-phrase', name: 'Shake out' },
  { id: 'middle', name: 'Bump Shake' },
  { id: 'end', name: 'Flash' },
  { id: 'tagged', name: 'Soft Twitch Transition', tags: ['shake'] },
  { id: 'unrelated', name: 'Soft Twitch Transition' }
];
assert.deepStrictEqual(search.search(substringCoverage, 'sh').map(function (match) { return match.item.id; }).sort(), ['beginning','beginning-phrase','end','middle','tagged'].sort(), 'substring matching should find supported searchable text at the beginning, middle, or end');
var shakeCoverage = [
  { id: 'shake', name: 'Shake', type: 'effect' },
  { id: 'shake-out', name: 'Shake out', type: 'preset' },
  { id: 'shake-one', name: 'Shake 1', type: 'preset' },
  { id: 'shake-two', name: 'Shake 2', type: 'preset' },
  { id: 'bump-shake', name: 'Bump Shake', type: 'preset' },
  { id: 'soft-twitch', name: 'Soft Twitch Transition', tags: ['shake'], type: 'preset' },
  { id: 'unrelated-shake-name', name: 'Soft Twitch Transition', type: 'preset' }
];
assert.deepStrictEqual(search.search(shakeCoverage, 'shake').map(function (match) { return match.item.id; }).sort(), ['shake','shake-out','shake-one','shake-two','bump-shake','soft-twitch'].sort(), 'all names and supported metadata containing shake should be returned');

assert.strictEqual(search.search([{ id: 'exact', name: 'Glow' }, { id: 'prefix', name: 'Glow Ramp' }], ' glow ')[0].matchField, 'name-exact');
assert.strictEqual(search.search([{ id: 'alias', name: 'Handheld Motion', aliases: ['shake'] }], 'shake')[0].matchField, 'alias-exact');
var multiword = search.search([
  { id: 'phrase', name: 'Deep Glow' },
  { id: 'reordered', name: 'Deep Glow' },
  { id: 'alias-only', name: 'Light Sweep', aliases: ['Glow Deep'] },
  { id: 'partial', name: 'Deep Blur' }
], 'Glow Deep');
assert.deepStrictEqual(multiword.map(function (result) { return result.item.id; }), ['phrase', 'reordered', 'alias-only'], 'all name tokens should match in any order and outrank alias-only results');
assert.strictEqual(multiword[0].matchField, 'name-all-terms', 'reordered multiword name hits should have a distinct match reason');
assert.strictEqual(multiword[2].matchField, 'alias-exact', 'an exact alias remains below a multiword name match');
assert.strictEqual(search.search([{ id: 'partial', name: 'Deep Blur' }], 'Deep Glow').length, 0, 'multiword matching requires every query term');
assert.strictEqual(search.search([{ id: 'tag', name: 'Directional Blur', tags: ['light'] }], 'light')[0].matchField, 'tag-exact');
assert.strictEqual(search.search([{ id: 'effect', name: 'Directional Blur', matchName: 'ADBE Directional Blur', category: 'Blur & Sharpen' }], 'adbe')[0].matchField, 'metadata-prefix');

var localItems = [
  { id: 'preset-shake', name: 'Camera Shake.ffx', fileName: 'Camera Shake.ffx', path: 'D:/Presets/Camera Shake.ffx', type: 'preset' },
  { id: 'preset-glow', name: 'Glow Sweep.ffx', fileName: 'Glow Sweep.ffx', type: 'preset' },
  { id: 'plugin-sapphire', name: 'Sapphire.aex', fileName: 'Sapphire.aex', type: 'plugin' },
  { id: 'effect-zoom', name: 'Zoom Blur', matchName: 'ADBE Zoom Blur', type: 'effect' },
  { id: 'custom-preset', name: 'My Custom Transition.ffx', fileName: 'My Custom Transition.ffx', type: 'preset' }
];
['sh', 'shake', 'glow', 'sapphire', 'zoom', 'custom transition'].forEach(function (query) {
  assert.ok(search.search(localItems, query).length > 0, 'expected a local search hit for ' + query);
});
assert.strictEqual(search.search(localItems, 'shake')[0].item.id, 'preset-shake');
assert.strictEqual(search.search(localItems, 'sapphire')[0].item.id, 'plugin-sapphire');
assert.strictEqual(search.search(localItems, 'zz-no-match').length, 0);
assert.deepStrictEqual(search.search(localItems, ''), []);
assert.strictEqual(search.normalize('  Camera   Movement '), 'camera movement');

var duplicateNames = [
  { id: 'first', name: 'Glow', type: 'effect' },
  { id: 'second', name: 'Glow', type: 'preset' }
];
assert.strictEqual(search.search(duplicateNames, 'glow').length, 2);
assert.strictEqual(search.search(duplicateNames, 'glow')[0].item.id, 'first');

var largeCatalogue = [];
var i;
for (i = 0; i < 10000; i += 1) largeCatalogue.push({ id: 'item-' + i, name: 'Sample Item ' + i, aliases: ['demo'], tags: ['sample'] });
largeCatalogue.push({ id: 'prefix-hit', name: 'Shake Sample' });
assert.strictEqual(search.search(largeCatalogue, 'sh')[0].item.id, 'prefix-hit');

console.log('PASS: exact/prefix/word-start/substring/alias/tag ranking, metadata fallback, preset filenames, six scenario queries, no-match, duplicates, and 10k items.');
