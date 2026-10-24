var assert = require('assert');
var tree = require('../client/search/resultTree');

var items = [
  { id: 'fx-a', name: 'Fast Blur', type: 'effect', category: 'Blur & Sharpen', matchName: 'ADBE Fast Blur' },
  { id: 'fx-b', name: 'Glow', type: 'effect', category: 'Color Correction', matchName: 'Plugin Glow' },
  { id: 'fx-unknown', name: 'Unknown Category', type: 'effect', category: '', matchName: 'Vendor.Unknown' },
  { id: 'aex', name: 'Deep Glow', type: 'plugin', path: 'C:\\Plugins\\Vendor\\Deep Glow.aex', source: 'Plug-in scan' },
  { id: 'preset-a', name: 'Camera Shake', type: 'preset', path: 'D:\\Presets\\Motion\\Camera Shake.ffx', source: 'Custom preset folder' },
  { id: 'preset-b', name: 'Glow Sweep', type: 'preset', path: 'D:\\Presets\\Light\\Glow Sweep.ffx', source: 'Custom preset folder' },
  { id: 'preset-nested', name: 'Soft Glow', fileName: 'Soft Glow.ffx', type: 'preset', path: 'D:/User Presets/Pack/Effects/Soft Glow.ffx', rootPath: 'D:/User Presets', relativePath: 'Pack/Effects/Soft Glow.ffx', source: 'User presets' },
  { id: 'preset-alpha', name: 'Aardvark', fileName: 'Aardvark.ffx', type: 'preset', path: 'D:/User Presets/Pack/Effects/Aardvark.ffx', rootPath: 'D:/User Presets', relativePath: 'Pack/Effects/Aardvark.ffx', source: 'User presets' },
  { id: 'preset-duplicate-folder', name: 'Transition', fileName: 'Transition.ffx', type: 'preset', path: 'D:/User Presets/Pack/Transitions/Effects/Transition.ffx', rootPath: 'D:/User Presets', relativePath: 'Pack/Transitions/Effects/Transition.ffx', source: 'User presets' },
  { id: 'preset-duplicate-root', name: 'Other', fileName: 'Other.ffx', type: 'preset', path: 'E:/User Presets/Pack/Other.ffx', rootPath: 'E:/User Presets', relativePath: 'Pack/Other.ffx', source: 'Custom preset folder' },
  { id: 'preset-large', name: 'Many', fileName: 'Many.ffx', type: 'preset', path: 'D:/User Presets/Large/Many.ffx', rootPath: 'D:/User Presets', relativePath: 'Large/Many.ffx', source: 'User presets' },
  { id: 'preset-no-path', name: 'Loose Preset', type: 'preset', path: '', source: 'Local folder' }
];

var browse = tree.build(items, [], false);
assert.deepStrictEqual(browse.map(function (root) { return root.label; }), ['Presets', 'Plug-in Files', 'Host Effects']);
assert.deepStrictEqual(browse[2].children.map(function (group) { return group.label; }), ['Blur & Sharpen', 'Color Correction']);
assert.strictEqual(browse[2].items[0].item.id, 'fx-unknown');
assert.strictEqual(browse[2].children.some(function (group) { return /uncategorized|vendor/i.test(group.label); }), false);
assert.strictEqual(browse[1].children[0].title, 'C:/Plugins/Vendor');
assert.strictEqual(browse[1].children[0].items[0].item.id, 'aex');
assert.deepStrictEqual(browse[0].children.slice(0, 2).map(function (group) { return group.title; }), ['D:/Presets/Light', 'D:/Presets/Motion']);
assert.strictEqual(browse[0].items[0].item.id, 'preset-no-path');
var userRoot = browse[0].children.filter(function (group) { return group.title === 'D:/User Presets'; })[0];
assert.ok(userRoot, 'scan root should be represented explicitly');
var pack = userRoot.children.filter(function (group) { return group.label === 'Pack'; })[0];
var effectsFolder = pack.children.filter(function (group) { return group.label === 'Effects'; })[0];
assert.deepStrictEqual(effectsFolder.items.map(function (entry) { return entry.item.name; }), ['Aardvark', 'Soft Glow'], 'files sort alphabetically within the same parent');
var transitionEffects = pack.children.filter(function (group) { return group.label === 'Transitions'; })[0].children[0];
assert.strictEqual(transitionEffects.label, 'Effects', 'same-named folders under different parents remain separate nodes');
assert.strictEqual(transitionEffects.items[0].item.id, 'preset-duplicate-folder');
assert.strictEqual(userRoot.fileCount, 4, 'folder count badge source is descendant file count');
assert.ok(userRoot.label.indexOf('D:/User Presets') !== -1 && browse[0].children.some(function (group) { return group.label.indexOf('E:/User Presets') !== -1; }), 'duplicate root names are disambiguated by full path');
assert.strictEqual(tree.parentPath('D:\\Presets\\Motion\\Shake.ffx'), 'D:/Presets/Motion');
assert.strictEqual(tree.leafName('D:\\Presets\\Motion'), 'Motion');

var matches = [
  { item: items[1], score: 700 },
  { item: items[0], score: 500 },
  { item: items[4], score: 600 }
];
var search = tree.build(items, matches, true);
assert.deepStrictEqual(search.filter(function (root) { return root.fileCount > 0; }).map(function (root) { return root.label; }), ['Presets', 'Host Effects'], 'visible search sections keep the requested fixed order even when another section has a stronger match');
assert.strictEqual(search[0].children[0].items[0].item.id, 'preset-a');
assert.strictEqual(search[2].label, 'Host Effects');
assert.strictEqual(search[2].children[0].items[0].item.id, 'fx-b');
var nestedSearch = tree.build(items, [{ item: items.filter(function (entry) { return entry.id === 'preset-nested'; })[0], score: 600 }], true);
assert.strictEqual(nestedSearch[0].children[0].children[0].children[0].items[0].item.path, 'D:/User Presets/Pack/Effects/Soft Glow.ffx', 'nested search must retain full preset path and folder chain');

function parentPresets(folderPaths) {
  return folderPaths.map(function (relativePath, index) {
    return { id: 'parent-test-' + index, name: 'shake ' + index, fileName: 'shake ' + index + '.ffx', type: 'preset', rootPath: 'C:/User Presets', relativePath: relativePath + '/shake ' + index + '.ffx', path: 'C:/User Presets/' + relativePath + '/shake ' + index + '.ffx' };
  });
}
function highlightedNodes(result) {
  var output = [];
  function visit(node) {
    if (node.matchParent) output.push(node);
    node.children.forEach(visit);
  }
  result.forEach(visit);
  return output;
}
[
  { path: '7K AE/7K Shakes', expected: '7K AE' },
  { path: 'Aestro Editing Pack/Effects', expected: 'Aestro Editing Pack' },
  { path: 'Ante Editing Pack/Editing Pack/Shakes', expected: 'Ante Editing Pack' },
  { path: 'Ante Effects/Shakes', expected: 'Ante Effects' },
  { path: 'Friston/friston/open at your own risk/crashing presets', expected: 'Friston' }
].forEach(function (scenario) {
  var entry = parentPresets([scenario.path])[0];
  var highlighted = highlightedNodes(tree.build([entry], [{ item: entry, score: 100 }], true));
  assert.deepStrictEqual(highlighted.map(function (node) { return node.label; }), [scenario.expected], 'only the intended first parent folder should highlight for ' + scenario.path);
});
var sameParentItems = parentPresets(['7K AE/7K Shakes', '7K AE/Other Shakes']);
var sameParentHighlights = highlightedNodes(tree.build(sameParentItems, sameParentItems.map(function (item) { return { item: item, score: 100 }; }), true));
assert.strictEqual(sameParentHighlights.length, 1, 'multiple results under one parent should set one parent node highlight');
assert.strictEqual(sameParentHighlights[0].label, '7K AE');
var differentParentItems = parentPresets(['7K AE/7K Shakes', 'Aestro Editing Pack/Effects']);
var differentParentHighlights = highlightedNodes(tree.build(differentParentItems, differentParentItems.map(function (item) { return { item: item, score: 100 }; }), true));
assert.deepStrictEqual(differentParentHighlights.map(function (node) { return node.label; }).sort(), ['7K AE', 'Aestro Editing Pack'].sort(), 'each matching parent should highlight');
var duplicateParentItems = [
  { id: 'dup-a', name: 'shake A', type: 'preset', rootPath: 'C:/First/User Presets', relativePath: 'Pack/Effects/shake A.ffx', path: 'C:/First/User Presets/Pack/Effects/shake A.ffx' },
  { id: 'dup-b', name: 'shake B', type: 'preset', rootPath: 'D:/Second/User Presets', relativePath: 'Pack/Effects/shake B.ffx', path: 'D:/Second/User Presets/Pack/Effects/shake B.ffx' }
];
var duplicateHighlights = highlightedNodes(tree.build(duplicateParentItems, duplicateParentItems.map(function (item) { return { item: item, score: 100 }; }), true));
assert.strictEqual(duplicateHighlights.length, 2, 'same-named parent folders from distinct scan roots must remain distinct');
assert.notStrictEqual(duplicateHighlights[0], duplicateHighlights[1]);
var duplicateRootTree = tree.build(duplicateParentItems, duplicateParentItems.map(function (item) { return { item: item, score: 100 }; }), true);
assert.notStrictEqual(duplicateRootTree[0].children[0].label, duplicateRootTree[0].children[1].label, 'visible scan roots disambiguate identical parent labels by source path');
var queryNamedFolderItems = parentPresets(['Shake Folder/Child']);
var unrelatedQueryFolderItems = parentPresets(['Other Pack/Child']);
var queryNameTree = tree.build(queryNamedFolderItems.concat(unrelatedQueryFolderItems), [{ item: unrelatedQueryFolderItems[0], score: 100 }], true);
assert.deepStrictEqual(highlightedNodes(queryNameTree).map(function (node) { return node.label; }), ['Other Pack'], 'folder text alone must never cause highlighting');
assert.strictEqual(tree.build(sameParentItems, [], false).some(function (root) { return highlightedNodes([root]).length > 0; }), false, 'browse mode must not retain search highlights');

var large = [];
for (var i = 0; i < 10000; i += 1) {
  large.push({ item: { id: 'p-' + i, name: 'Preset ' + i, type: 'preset', path: 'C:/Presets/Set/Preset ' + i + '.ffx' }, score: i });
}
var largeTree = tree.build([], large, true);
assert.strictEqual(largeTree[0].label, 'Presets');
assert.strictEqual(largeTree[0].children[0].items.length, 10000);
assert.strictEqual(largeTree[0].children[0].items[0].item.id, 'p-9999');

console.log('PASS: nested preset hierarchy, duplicate scan roots, descendant file counts, unknown effect metadata, source paths, ranking, and 10k-item tree.');
