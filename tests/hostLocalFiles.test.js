var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var hostSource = fs.readFileSync(require.resolve('../host.jsx'), 'utf8');
var localDiscovery = require('../client/search/localDiscovery');
var search = require('../client/search/searchEngine');

function FolderObject(path, children, exists, alias) {
  this.fsName = path;
  this.name = path.split(/[\\/]/).pop();
  this.children = children || [];
  this.exists = exists !== false;
  this.alias = alias === true;
  this.getFiles = function () { return this.children; };
  this.parent = null;
}
function Folder(path) { return folders[path] || new FolderObject(path, [], false); }
Folder.prototype = FolderObject.prototype;

function FileObject(path, exists) {
  this.fsName = path;
  var actualName = path.split(/[\\/]/).pop();
  this.name = encodeURIComponent(actualName);
  this.displayName = actualName;
  this.exists = exists !== false;
}
function File(path) { return fileMap[path] || new FileObject(path, false); }
File.prototype = FileObject.prototype;
File.decode = function (uriName) { return decodeURIComponent(uriName); };

function CompItem() { this.selectedLayers = []; }

var folders = {};
var fileMap = {};
function folder(path, children, parent) {
  var value = new FolderObject(path, children, true);
  folders[path] = value;
  value.parent = parent || null;
  return value;
}
function file(path) {
  var value = new FileObject(path, true);
  fileMap[path] = value;
  return value;
}

var adobe = folder('C:/Program Files/Adobe');
var ae = folder('C:/Program Files/Adobe/Adobe After Effects 2026', [], adobe);
var support = folder('C:/Program Files/Adobe/Adobe After Effects 2026/Support Files', [], ae);
var presets = folder(support.fsName + '/Presets', [], support);
var installPlugins = folder(support.fsName + '/Plug-ins', [], support);
var common = folder(adobe.fsName + '/Common/Plug-ins', [], adobe);
var docs = folder('C:/Users/Test/Documents');
var docsAdobe = folder(docs.fsName + '/Adobe', [], docs);
var userAe = folder(docsAdobe.fsName + '/After Effects 2026', [], docsAdobe);
var userPresets = folder(userAe.fsName + '/User Presets', [], userAe);
var goodPreset = file(presets.fsName + '/Built In.ffx');
var userPreset = file(userPresets.fsName + '/Motion.ffx');
var ccOnePreset = file(userPresets.fsName + '/CC 1.ffx');
var audioOnePreset = file(userPresets.fsName + '/Audio Effect 1.ffx');
var ordinaryPreset = file(userPresets.fsName + '/Reverb.ffx');
var literalPercentPreset = file(userPresets.fsName + '/Literal%20Token.ffx');
var fallbackPreset = file(userPresets.fsName + '/Fallback Name.ffx');
fallbackPreset.displayName = '';
var pluginBinary = file(installPlugins.fsName + '/Deep Glow.aex');
var sharedBinary = file(common.fsName + '/Shared Effect.aex');
var excludedAlias = folder(installPlugins.fsName + '/Alias Folder', [file(installPlugins.fsName + '/Alias Folder/Hidden.aex')], installPlugins);
excludedAlias.alias = true;
presets.children = [goodPreset];
userPresets.children = [userPreset, ccOnePreset, audioOnePreset, ordinaryPreset, literalPercentPreset, fallbackPreset];
installPlugins.children = [pluginBinary, excludedAlias];
common.children = [sharedBinary];
userAe.children = [userPresets];
docsAdobe.children = [userAe];
folders['C:/Program Files/Adobe/Common/Plug-ins'] = common;
Folder.appPackage = support;
Folder.myDocuments = docs;

var applied = [];
var beginCount = 0;
var endCount = 0;
var comp = new CompItem();
comp.selectedLayers = [{ applyPreset: function (preset) { applied.push(preset.fsName); } }];
var app = {
  version: '26.3',
  project: { activeItem: comp },
  beginUndoGroup: function () { beginCount += 1; },
  endUndoGroup: function () { endCount += 1; }
};
var context = { app: app, Folder: Folder, File: File, CompItem: CompItem };
vm.runInNewContext(hostSource, context);

var roots = JSON.parse(context.getLocalDiscoveryRoots());
assert.strictEqual(roots.ok, true);
assert.strictEqual(roots.presetRoots.length, 2);
assert.strictEqual(roots.pluginRoots.length, 2);

var foundPresets = JSON.parse(context.scanLocalPresetFolder(presets.fsName, 'Built-in'));
assert.strictEqual(foundPresets.count, 1);
assert.strictEqual(foundPresets.items[0].type, 'preset');
assert.strictEqual(foundPresets.items[0].availability, 'file-present');
var foundUserPresets = JSON.parse(context.scanLocalPresetFolder(userPresets.fsName, 'User presets'));
assert.strictEqual(foundUserPresets.count, 6);
function foundByPath(path) { return foundUserPresets.items.filter(function (item) { return item.path === path; })[0]; }
var scannedCCOne = foundByPath(ccOnePreset.fsName);
var scannedAudioOne = foundByPath(audioOnePreset.fsName);
var scannedOrdinary = foundByPath(ordinaryPreset.fsName);
var scannedLiteralPercent = foundByPath(literalPercentPreset.fsName);
var scannedFallback = foundByPath(fallbackPreset.fsName);
assert.strictEqual(ccOnePreset.name, 'CC%201.ffx', 'mock ExtendScript File.name is URI-encoded');
assert.strictEqual(scannedCCOne.fileName, 'CC 1.ffx', 'File.displayName provides the readable filename');
assert.strictEqual(scannedCCOne.name, 'CC 1', 'encoded spaces must not leak into preset labels');
assert.strictEqual(scannedAudioOne.fileName, 'Audio Effect 1.ffx');
assert.strictEqual(scannedAudioOne.name, 'Audio Effect 1');
assert.strictEqual(scannedOrdinary.name, 'Reverb', 'ordinary filenames remain unchanged');
assert.strictEqual(literalPercentPreset.name, 'Literal%2520Token.ffx', 'literal percent signs are URI-escaped in File.name');
assert.strictEqual(scannedLiteralPercent.name, 'Literal%20Token', 'File.displayName prevents decoding a literal %20 sequence twice');
assert.strictEqual(scannedFallback.name, 'Fallback Name', 'File.decode is a fallback for URI-encoded File.name');
assert.strictEqual(scannedCCOne.path, ccOnePreset.fsName, 'the apply path remains the unencoded filesystem path');

var parsedUserPresets = localDiscovery.parseResponse(JSON.stringify(foundUserPresets), 'preset', userPresets.fsName);
var parsedCCOne = parsedUserPresets.items.filter(function (item) { return item.path === ccOnePreset.fsName; })[0];
assert.strictEqual(search.search([parsedCCOne], 'CC 1')[0].item.name, 'CC 1', 'search should match the decoded display filename');
assert.strictEqual(search.search([parsedCCOne], 'CC Grade').length, 0, 'custom alias text must not be added to preset search');
assert.strictEqual(search.search([parsedCCOne], 'CC 1')[0].item.path, ccOnePreset.fsName, 'real-name search must retain the original preset path identity');

var foundPlugins = JSON.parse(context.scanLocalPluginFolder(installPlugins.fsName, 'Installed plugins'));
assert.strictEqual(foundPlugins.count, 1);
assert.strictEqual(foundPlugins.items[0].name, 'Deep Glow');
var foundShared = JSON.parse(context.scanLocalPluginFolder(common.fsName, 'Shared plugins'));
assert.strictEqual(foundShared.count, 1);

var validation = JSON.parse(context.applyPresetToSelectedLayers('C:/missing.ffx'));
assert.strictEqual(validation.ok, false);
assert.strictEqual(validation.stage, 'validation');
assert.strictEqual(beginCount, 0);
file('C:/User Presets/invalid.txt');
validation = JSON.parse(context.applyPresetToSelectedLayers('C:/User Presets/invalid.txt'));
assert.strictEqual(validation.ok, false);
assert.strictEqual(validation.stage, 'validation');
assert.strictEqual(beginCount, 0);

file('C:/User Presets/Motion.ffx');
var appliedResult = JSON.parse(context.applyPresetToSelectedLayers('C:/User Presets/Motion.ffx'));
assert.strictEqual(appliedResult.ok, true);
assert.strictEqual(appliedResult.resultVerified, false);
assert.deepStrictEqual(applied, ['C:/User Presets/Motion.ffx']);
assert.strictEqual(beginCount, 1);
assert.strictEqual(endCount, 1);

comp.selectedLayers = [{ applyPreset: function () { throw new Error('simulated apply failure'); } }];
var failedApply = JSON.parse(context.applyPresetToSelectedLayers('C:/User Presets/Motion.ffx'));
assert.strictEqual(failedApply.ok, false);
assert.strictEqual(failedApply.resultVerified, false);
assert.strictEqual(beginCount, 2);
assert.strictEqual(endCount, 2);

comp.selectedLayers = [];
validation = JSON.parse(context.applyPresetToSelectedLayers('C:/User Presets/Motion.ffx'));
assert.strictEqual(validation.ok, false);
assert.strictEqual(validation.stage, 'validation');

comp.selectedLayers = [{ applyPreset: function (preset) { applied.push(preset.fsName); } }];
var applyScannedPreset = JSON.parse(context.applyPresetToSelectedLayers(scannedCCOne.path));
assert.strictEqual(applyScannedPreset.ok, true);
assert.strictEqual(applied[applied.length - 1], 'C:/Users/Test/Documents/Adobe/After Effects 2026/User Presets/CC 1.ffx', 'application must receive the unchanged original filesystem path');

// Layer.applyPreset processes all selected layers in the layer's composition; emulate that documented host behavior.
var presetTargets = [];
var secondSelectedLayer = {name:'Second selected layer'};
var firstSelectedLayer = {
  name:'First selected layer',
  applyPreset:function (preset) {
    comp.selectedLayers.forEach(function (layer) { presetTargets.push({layer:layer.name,preset:preset.fsName}); });
  }
};
comp.selectedLayers = [firstSelectedLayer, secondSelectedLayer];
var multiLayerPreset = JSON.parse(context.applyPresetToSelectedLayers('C:/User Presets/Motion.ffx'));
assert.strictEqual(multiLayerPreset.ok, true);
assert.deepStrictEqual(presetTargets, [
  {layer:'First selected layer',preset:'C:/User Presets/Motion.ffx'},
  {layer:'Second selected layer',preset:'C:/User Presets/Motion.ffx'}
], 'the existing Layer.applyPreset call must retain After Effects selected-layer semantics');

console.log('PASS: local .ffx/.aex scans, default roots, and applyPreset validation/call using simulated filesystem and After Effects objects (not an in-app test).');
