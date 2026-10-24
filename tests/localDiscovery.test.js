var assert = require('assert');
var discovery = require('../client/search/localDiscovery');
var data = {};
var savedAliasData = '{"c:/presets/preset a.ffx":"My easy name"}';
data['aeus.presetDisplayAliases.v1'] = savedAliasData;
var storage = {
  getItem: function (key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
  setItem: function (key, value) { data[key] = value; }
};

assert.deepStrictEqual(discovery.parseFolders('[" C:\\\\Presets ","c:/presets/","","D:/User"]'), ['C:/Presets', 'D:/User']);
assert.strictEqual(discovery.parseFolders('{bad json}').length, 0);
assert.deepStrictEqual(discovery.addFolder(storage, 'D:\\Own Presets').folders, ['D:/Own Presets']);
assert.deepStrictEqual(discovery.addFolder(storage, 'd:/own presets/').folders, ['D:/Own Presets']);
assert.deepStrictEqual(discovery.removeFolder(storage, 'D:/OWN PRESETS').folders, []);

var presets = discovery.parseResponse(JSON.stringify({ ok: true, items: [
  { id: 'x', name: 'Preset A', fileName: 'Preset A.ffx', path: 'C:/Presets/Preset A.ffx', source: 'Custom folder', type: 'preset' },
  { id: 'y', name: 'Wrong kind', path: 'C:/x.aex', source: 'folder', type: 'plugin' }
]}), 'preset', 'C:/Presets');
assert.strictEqual(presets.ok, true);
assert.strictEqual(presets.count, 1);
assert.strictEqual(presets.items[0].availability, 'file-present');
assert.strictEqual(presets.items[0].applicationStatus, 'not-tested');
assert.strictEqual(presets.items[0].name, 'Preset A', 'visible preset name must come from the filename without .ffx');
assert.strictEqual(presets.items[0].fileName, 'Preset A.ffx', 'original filename must remain available');
assert.strictEqual(presets.items[0].relativePath, 'Preset A.ffx', 'relative path should be based on scan root');
assert.strictEqual(presets.items[0].path, 'C:/Presets/Preset A.ffx', 'full path remains the application identity');
assert.strictEqual(discovery.filenameLabel('Look.FFX'), 'Look');
assert.strictEqual(discovery.relativePath('C:\\Presets\\Pack\\Look.ffx', 'C:/Presets'), 'Pack/Look.ffx');
assert.strictEqual(discovery.readAliases, undefined, 'the user-created alias storage API should be removed');
assert.strictEqual(discovery.setAlias, undefined, 'the user-created alias editing API should be removed');
assert.strictEqual(data['aeus.presetDisplayAliases.v1'], savedAliasData, 'legacy alias data must remain untouched');

var plugins = discovery.parseResponse(JSON.stringify({ ok: true, items: [
  { id: 'x', name: 'Third-party', path: 'C:/Plug-ins/Third-party.aex', source: 'Plug-in folder', type: 'plugin' }
]}), 'plugin');
assert.strictEqual(plugins.count, 1);
assert.strictEqual(plugins.items[0].availability, 'file-present');

console.log('PASS: local discovery parsing, custom folder storage, normalization, deduplication, removal, and preservation of legacy alias data.');
