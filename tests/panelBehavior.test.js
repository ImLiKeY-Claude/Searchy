var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var path = require('path');
var profileRoot = process.env.AEUS_PROFILE_BASE || path.resolve(__dirname, '..');
var search = require(path.join(profileRoot, 'client/search/searchEngine.js'));
var effects = require(path.join(profileRoot, 'client/search/effectDiscovery.js'));
var folders = require(path.join(profileRoot, 'client/search/localDiscovery.js'));
var tree = require(path.join(profileRoot, 'client/search/resultTree.js'));
var perfPresetCount = parseInt(process.env.AEUS_PERF_PRESETS || '16', 10);
var perf = { active: false, searchMs: 0, treeMs: 0, domMutationMs: 0, domMutations: 0, maxSearchTreeItems: 0 };
var treeIndexBuilds = 0;
function elapsedMs(start) { return Number(process.hrtime.bigint() - start) / 1000000; }
function timedQueryStats(values) {
  values.sort(function (a, b) { return a - b; });
  return values[Math.floor(values.length / 2)] || 0;
}
var html = fs.readFileSync(path.join(profileRoot, 'index.html'), 'utf8');
var inline = (html.match(/<script>([\s\S]*?)<\/script>/i) || [])[1];
assert.ok(inline, 'expected the panel inline controller');

function Element(tagName) {
  this.tagName = String(tagName || 'div').toUpperCase();
  this.children = [];
  this.parentNode = null;
  this.style = {};
  this.attributes = {};
  this.listeners = {};
  this._text = '';
  this.className = '';
  this.open = false;
  this.value = '';
  this.disabled = false;
  this.hidden = false;
}
Object.defineProperty(Element.prototype, 'textContent', {
  get: function () { return this._text + this.children.map(function (child) { return child.textContent || ''; }).join(''); },
  set: function (value) { var start = perf.active ? process.hrtime.bigint() : null; this._text = String(value == null ? '' : value); this.children.forEach(function (child) { child.parentNode = null; }); this.children = []; if (perf.active) { perf.domMutationMs += elapsedMs(start); perf.domMutations += 1; } }
});
Element.prototype.appendChild = function (child) { var start = perf.active ? process.hrtime.bigint() : null; child.parentNode = this; this.children.push(child); if (perf.active) { perf.domMutationMs += elapsedMs(start); perf.domMutations += 1; } return child; };
Element.prototype.removeChild = function (child) { var start = perf.active ? process.hrtime.bigint() : null; var index = this.children.indexOf(child); if (index !== -1) this.children.splice(index, 1); child.parentNode = null; if (perf.active) { perf.domMutationMs += elapsedMs(start); perf.domMutations += 1; } return child; };
Element.prototype.setAttribute = function (key, value) { this.attributes[key] = String(value); };
Element.prototype.getAttribute = function (key) { return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null; };
Element.prototype.addEventListener = function (name, handler) { (this.listeners[name] || (this.listeners[name] = [])).push(handler); };
Element.prototype.dispatch = function (name, event) { var evt = event || {}; evt.target = evt.target || this; evt.currentTarget = this; evt.preventDefault = evt.preventDefault || function () { evt.defaultPrevented = true; }; evt.stopPropagation = evt.stopPropagation || function () {}; (this.listeners[name] || []).forEach(function (handler) { handler(evt); }); return evt; };
Element.prototype.focus = function () { document.activeElement = this; };
Element.prototype.click = function () { this.dispatch('click', {}); };
Element.prototype.querySelectorAll = function (selector) {
  var found = [];
  function visit(node) {
    node.children.forEach(function (child) {
      var yes = selector === '[data-tree-select]' ? child.getAttribute('data-tree-select') === 'true' :
        selector === '[data-tree-heading]' ? child.getAttribute('data-tree-heading') === 'true' :
        selector === '[data-tab-count]' ? child.getAttribute('data-tab-count') !== null : false;
      if (yes) found.push(child);
      visit(child);
    });
  }
  visit(this);
  return found;
};
Element.prototype.querySelector = function (selector) { return this.querySelectorAll(selector)[0] || null; };
Element.prototype.contains = function (node) { var current = node; while (current) { if (current === this) return true; current = current.parentNode; } return false; };

var ids = ['search-input','search-clear','filter-tabs','settings-toggle','settings-menu','results','result-count','discovery-status','local-status','panel-status','refresh-effects','refresh-local','add-preset-folder','custom-folders','folder-summary','quick-apply-drop','drag-diagnostic-status'];
var elements = {};
ids.forEach(function (id) { elements[id] = new Element(id === 'search-input' ? 'input' : 'div'); elements[id].id = id; });
elements['discovery-status'].hidden = true;
elements['local-status'].hidden = true;
elements['drag-diagnostic-status'].hidden = true;
var filterButtons = ['all','effect','plugin','preset'].map(function (type) {
  var tab = new Element('button');
  var badge = new Element('span');
  tab.setAttribute('data-filter', type);
  tab.setAttribute('aria-selected', type === 'all' ? 'true' : 'false');
  badge.setAttribute('data-tab-count', type);
  badge.textContent = '0';
  tab.appendChild(badge);
  elements['filter-tabs'].appendChild(tab);
  return tab;
});
var document = {
  activeElement: null,
  listeners: {},
  addEventListener: function (name, handler) { (this.listeners[name] || (this.listeners[name] = [])).push(handler); },
  dispatch: function (name, event) { var evt = event || {}; evt.target = evt.target || elements.results; evt.currentTarget = this; evt.preventDefault = evt.preventDefault || function () { evt.defaultPrevented = true; }; (this.listeners[name] || []).forEach(function (handler) { handler(evt); }); return evt; },
  getElementById: function (id) { return elements[id]; },
  createElement: function (tag) { return new Element(tag); },
  createTextNode: function (text) { return { textContent: String(text), parentNode: null, children: [] }; }
};
elements['quick-apply-drop'].getBoundingClientRect = function () { return {left:10,top:20,right:352,bottom:43,width:342,height:23}; };
document.elementFromPoint = function () { return elements['quick-apply-drop']; };
var scheduledWindowTimers = [];
function flushWindowTimers() { while (scheduledWindowTimers.length) { scheduledWindowTimers.sort(function (a,b) { return a.delay-b.delay; }); scheduledWindowTimers.shift().callback(); } }
var storageValues = {};
var legacyAliasData = '{"d:/custom presets/pack 0/motion/my custom preset.ffx":"Easy Preset"}';
storageValues['aeus.presetDisplayAliases.v1'] = legacyAliasData;
var legacyAliasStorageReads = 0;
var legacyAliasStorageWrites = 0;
var storage = {
  getItem: function (key) { if (key === 'aeus.presetDisplayAliases.v1') legacyAliasStorageReads += 1; return Object.prototype.hasOwnProperty.call(storageValues,key) ? storageValues[key] : null; },
  setItem: function (key,value) { if (key === 'aeus.presetDisplayAliases.v1') legacyAliasStorageWrites += 1; storageValues[key] = value; }
};
var presetItems = [];
for (var i = 0; i < perfPresetCount; i += 1) {
  var presetName = i === 0 ? 'Camera Shake.ffx' : (i === 1 ? 'My Custom Preset.ffx' : (i === 2 ? "Jarle's Deadpool Handheld Camera Long Lens.ffx" : (i % 5 === 0 ? 'Shake Preset ' + i + '.ffx' : (i % 7 === 0 ? 'Glow Sweep ' + i + '.ffx' : 'Preset ' + i + '.ffx'))));
  presetItems.push({ id:'preset-' + i, name:presetName.replace(/\.ffx$/i,''), fileName:presetName, path:'D:/Custom Presets/Pack ' + (perfPresetCount > 16 ? (i < 2 ? 0 : i % 40) : 0) + '/Motion/' + presetName, source:'Custom preset folder', type:'preset' });
}
var effectItems = [
  { id:'fx-deep-glow', name:'Deep Glow', matchName:'Plugin.DeepGlow', category:'Stylize', type:'effect', source:'After Effects app.effects', hostListed:true },
  { id:'fx-shake', name:'Camera Shake', matchName:'Vendor.CameraShake', category:'Animation', type:'effect', source:'After Effects app.effects', hostListed:true },
  { id:'fx-zoom', name:'Zoom Blur', matchName:'ADBE Zoom Blur', category:'Blur & Sharpen', type:'effect', source:'After Effects app.effects', hostListed:true },
  { id:'fx-long', name:'Very Long Effect Name That Must Stay On One Line Without Damaging The Tree Layout', matchName:'ADBE Long', category:'Blur & Sharpen', type:'effect', source:'After Effects app.effects', hostListed:true },
  { id:'fx-exact-label', name:'Exact  Display\u00a0Name™', displayName:'Exact  Display\u00a0Name™', displayNameAvailable:true, matchName:'Vendor.Internal.ExactLabel', category:'Test Metadata', type:'effect', source:'After Effects app.effects', hostListed:true }
];
for (var effectIndex = effectItems.length; effectIndex < (perfPresetCount > 16 ? 462 : effectItems.length); effectIndex += 1) {
  effectItems.push({ id:'fx-generated-' + effectIndex, name:'Effect ' + effectIndex, matchName:'ADBE Effect ' + effectIndex, category:'Generated', type:'effect', source:'After Effects app.effects', hostListed:true });
}
var pluginItems = [];
var pluginCount = perfPresetCount > 16 ? 651 : 1;
for (var pluginIndex = 0; pluginIndex < pluginCount; pluginIndex += 1) {
  var pluginName = pluginIndex === 0 ? 'Sapphire.aex' : 'Plugin ' + pluginIndex + '.aex';
  pluginItems.push({ id:'plugin-' + pluginIndex, name:pluginName.replace(/\.aex$/i,''), fileName:pluginName, path:'C:/AE/Plug-ins/Vendor ' + (pluginIndex % 25) + '/' + pluginName, source:'After Effects plug-ins', type:'plugin' });
}
var appliedCalls = [];
var appliedEffectCalls = [];
var evalScriptCalls = [];
var deferApplyResponses = false;
var deferredApplyCallbacks = [];
var confirmationCalls = 0;
var promptCalls = 0;
var failNextApply = false;
var dragDiagnosticFile = '';
var dragDiagnosticContents = '';
var window = {
  localStorage: storage,
  AEUSSearch: {
    normalize: search.normalize,
    search: function (items, query) { var start = perf.active ? process.hrtime.bigint() : null; var matches = search.search(items, query); if (perf.active) perf.searchMs += elapsedMs(start); return matches; }
  },
  AEUSEffectDiscovery: effects,
  AEUSLocalDiscovery: folders,
  AEUSResultTree: {
    createIndex: function (items) { treeIndexBuilds += 1; return tree.createIndex(items); },
    build: function (items, matches, searching, index) { var start = perf.active ? process.hrtime.bigint() : null; var result = tree.build(items, matches, searching, index); if (perf.active) { perf.treeMs += elapsedMs(start); if (searching) perf.maxSearchTreeItems = Math.max(perf.maxSearchTreeItems, (matches || []).length); } return result; }
  },
  confirm: function () { confirmationCalls += 1; return true; },
  prompt: function () { promptCalls += 1; return 'Easy Preset'; },
  setTimeout: function (callback, delay) { scheduledWindowTimers.push({callback:callback,delay:Number(delay)||0}); },
  cep: { fs: {
    showOpenDialogEx: function () { return {err:0,data:['E:/My Presets']}; },
    readFile: function (file) { assert.strictEqual(file, dragDiagnosticFile); return {err:0,data:dragDiagnosticContents}; },
    writeFile: function (file, data) { assert.strictEqual(file, dragDiagnosticFile); dragDiagnosticContents = data; return {err:0,data:''}; }
  } },
  __adobe_cep__: { evalScript: function (expression, callback) {
    evalScriptCalls.push(expression);
    var response;
    if (expression === 'getEffectCatalogue()') response = {ok:true,hostVersion:'26.3',items:effectItems};
    else if (expression === 'getSearchyDragDiagnosticLogPath()') { dragDiagnosticFile = 'C:/Users/Test/AppData/Local/Temp/Searchy-drag-diagnostics.jsonl'; callback(dragDiagnosticFile); return; }
    else if (expression === 'getLocalDiscoveryRoots()') response = {ok:true,presetRoots:[{path:'D:/Custom Presets',source:'User presets'}],pluginRoots:[{path:'C:/AE/Plug-ins',source:'After Effects plug-ins'}]};
    else if (expression === 'getApplyTargetStatus()') response = {ok:true,activeItemName:'Verification Comp',activeItemType:'Composition',activeItemIsComp:true,selectedLayerCount:1,selectedLayerNames:['Verification Layer']};
    else if (expression.indexOf('scanLocalPresetFolder(') === 0) response = {ok:true,items:presetItems};
    else if (expression.indexOf('scanLocalPluginFolder(') === 0) response = {ok:true,items:pluginItems};
    else if (expression.indexOf('applyPresetToSelectedLayers(') === 0) { appliedCalls.push(expression); response = failNextApply ? {ok:false,error:'Simulated preset application failure'} : {ok:true,message:'Preset call completed.'}; failNextApply = false; }
    else if (expression.indexOf('applyEffectToSelectedLayers(') === 0) { appliedEffectCalls.push(expression); response = failNextApply ? {ok:false,error:'Simulated effect application failure'} : {ok:true,message:'Effect added; inspect the composition.'}; failNextApply = false; }
    else response = {ok:false,error:'Unexpected bridge call'};
    if (deferApplyResponses && (expression.indexOf('applyPresetToSelectedLayers(') === 0 || expression.indexOf('applyEffectToSelectedLayers(') === 0)) {
      deferredApplyCallbacks.push(function () { callback(JSON.stringify(response)); });
    } else callback(JSON.stringify(response));
  } }
};
var context = { document:document, window:window, Array:Array, String:String, JSON:JSON, Object:Object, RegExp:RegExp, Math:Math };
vm.runInNewContext(inline, context);
assert.strictEqual(legacyAliasStorageReads, 0, 'panel initialization must not read retained custom alias data');
assert.strictEqual(legacyAliasStorageWrites, 0, 'panel initialization must not alter retained custom alias data');
assert.strictEqual(storageValues['aeus.presetDisplayAliases.v1'], legacyAliasData, 'legacy custom alias data must remain intact');

var resultRootSummaries = elements.results.querySelectorAll('[data-tree-heading]').filter(function (summary) { return summary.parentNode.className === 'tree-root'; });
assert.strictEqual(resultRootSummaries.length, 3, 'browse mode should render the three source sections');
assert.deepStrictEqual(resultRootSummaries.map(function (summary) { return summary.children[0].textContent; }), ['Presets', 'Plug-in Files', 'Host Effects'], 'browse sections should use the requested order');
assert.ok(resultRootSummaries.every(function (summary) { return summary.parentNode.open === false; }), 'all top-level sections should start collapsed');
var firstRootDisclosure = resultRootSummaries[0].parentNode;
firstRootDisclosure.open = true;
assert.strictEqual(firstRootDisclosure.open, true, 'a collapsed top-level section remains expandable');
firstRootDisclosure.open = false;
assert.strictEqual(firstRootDisclosure.open, false, 'an expanded top-level section remains collapsible');
assert.strictEqual(elements['result-count'].textContent, (presetItems.length + effectItems.length + pluginItems.length) + ' items');
assert.ok(elements['result-count'].title.indexOf('host-listed effects · After Effects 26.3') !== -1, 'technical host count/version should be available as secondary tooltip only');
assert.strictEqual(elements['discovery-status'].hidden, true, 'technical discovery status should stay hidden from normal UI');
assert.strictEqual(elements['local-status'].hidden, true, 'raw local/host diagnostic status should stay hidden from normal UI');
assert.strictEqual(elements['drag-diagnostic-status'].hidden, true, 'drag diagnostic display should stay hidden from normal UI');
assert.strictEqual(filterButtons[0].children[0].textContent, String(presetItems.length + effectItems.length + pluginItems.length), 'All tab should show the real catalogue count');
assert.strictEqual(filterButtons[1].children[0].textContent, String(effectItems.length), 'Effects tab should count host effects');
elements['filter-tabs'].dispatch('click', {target:filterButtons[1]});
assert.strictEqual(elements['result-count'].textContent, effectItems.length + ' items', 'Effects tab should filter the browse tree to effects');
assert.ok(elements.results.querySelectorAll('[data-tree-select]').every(function (row) { return row.getAttribute('data-type') === 'effect'; }), 'Effects tab must not show plug-ins or presets');
elements['filter-tabs'].dispatch('click', {target:filterButtons[2]});
assert.ok(elements.results.querySelectorAll('[data-tree-select]').every(function (row) { return row.getAttribute('data-type') === 'plugin'; }), 'Plugins tab must filter the existing local plug-in catalogue');
elements['filter-tabs'].dispatch('click', {target:filterButtons[3]});
assert.ok(elements.results.querySelectorAll('[data-tree-select]').every(function (row) { return row.getAttribute('data-type') === 'preset'; }), 'Presets tab must preserve the existing preset tree');
elements['filter-tabs'].dispatch('click', {target:filterButtons[1]});
elements['search-input'].value = 'shake';
elements['search-input'].dispatch('input');
assert.ok(elements.results.querySelectorAll('[data-tree-select]').every(function (row) { return row.getAttribute('data-type') === 'effect'; }), 'search results must respect the selected Effects tab');
assert.ok(elements.results.querySelectorAll('[data-tree-heading]').some(function (summary) { return summary.className.indexOf('match-parent') !== -1; }), 'matching host-effect category should receive the parent highlight state');
elements['filter-tabs'].dispatch('click', {target:filterButtons[3]});
assert.ok(elements.results.querySelectorAll('[data-tree-select]').every(function (row) { return row.getAttribute('data-type') === 'preset'; }), 'changing tabs during a search must filter results immediately');
elements['search-input'].value = '';
elements['search-input'].dispatch('input');
elements['filter-tabs'].dispatch('click', {target:filterButtons[0]});
elements['settings-toggle'].click();
assert.strictEqual(elements['settings-menu'].hidden, false, 'settings gear should open the existing library controls');
assert.strictEqual(elements['settings-toggle'].getAttribute('aria-expanded'), 'true');
document.dispatch('click', {target:elements.results});
assert.strictEqual(elements['settings-menu'].hidden, true, 'clicking outside should close the settings menu');
elements['settings-toggle'].click();
document.dispatch('keydown', {key:'Escape',target:elements['settings-menu']});
assert.strictEqual(elements['settings-menu'].hidden, true, 'Escape should close the settings menu');
assert.ok(elements['add-preset-folder'] && elements['refresh-local'] && elements['refresh-effects'], 'settings menu must retain all existing library-management controls');
var appliesBeforeMenuActions = appliedCalls.length + appliedEffectCalls.length;
var effectRefreshesBefore = evalScriptCalls.filter(function (call) { return call === 'getEffectCatalogue()'; }).length;
elements['settings-toggle'].click();
elements['refresh-effects'].click();
assert.strictEqual(evalScriptCalls.filter(function (call) { return call === 'getEffectCatalogue()'; }).length, effectRefreshesBefore + 1, 'Refresh Effects menu action should call the existing host discovery function');
assert.strictEqual(elements['settings-menu'].hidden, true, 'using a settings action should close the menu');
var localScansBefore = evalScriptCalls.filter(function (call) { return call === 'getLocalDiscoveryRoots()'; }).length;
elements['settings-toggle'].click();
elements['refresh-local'].click();
assert.strictEqual(evalScriptCalls.filter(function (call) { return call === 'getLocalDiscoveryRoots()'; }).length, localScansBefore + 1, 'Rescan Files menu action should call existing local discovery');
assert.strictEqual(elements['settings-menu'].hidden, true, 'Rescan Files should close the menu');
assert.strictEqual(appliedCalls.length + appliedEffectCalls.length, appliesBeforeMenuActions, 'settings actions must not apply or select results');
var effectRoot = resultRootSummaries.filter(function (summary) { return summary.children[0].textContent === 'Host Effects'; })[0].parentNode;
assert.strictEqual(effectRoot.open, false, 'top-level source roots stay collapsed in browse mode');
var longRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.title.indexOf('Very Long Effect Name') === 0; })[0];
assert.ok(longRow, 'long effect names should remain in the tree');
assert.ok(longRow.title.indexOf('Without Damaging The Tree Layout') !== -1, 'full long names should remain available via the row title');
elements['search-input'].value = 'Exact';
elements['search-input'].dispatch('input');
var exactHostLabelRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.getAttribute('data-key') === 'fx-exact-label'; })[0];
assert.ok(exactHostLabelRow, 'effect with host displayName metadata should be searchable');
assert.strictEqual(exactHostLabelRow.children[0].textContent, 'Exact  Display\u00a0Name™', 'effect label rendering must preserve the exact host displayName string');
assert.ok(exactHostLabelRow.textContent.indexOf('Vendor.Internal.ExactLabel') === -1, 'internal matchName must not appear as the result label');
elements['search-input'].value = '';
elements['search-input'].dispatch('input');
resultRootSummaries = elements.results.querySelectorAll('[data-tree-heading]').filter(function (summary) { return summary.parentNode.className === 'tree-root'; });
effectRoot = resultRootSummaries.filter(function (summary) { return summary.children[0].textContent === 'Host Effects'; })[0].parentNode;
var firstCategorySummary = effectRoot.querySelectorAll('[data-tree-heading]').filter(function (summary) { return summary.parentNode.className === 'tree-category'; })[0];
assert.ok(firstCategorySummary, 'effect category should be nested beneath its source');
assert.strictEqual(firstCategorySummary.parentNode.open, false, 'browse categories should start collapsed');
firstCategorySummary.focus();
elements.results.dispatch('keydown', {key:'ArrowRight',target:firstCategorySummary});
assert.strictEqual(firstCategorySummary.parentNode.open, true, 'Right should expand a focused category');
elements.results.dispatch('keydown', {key:'ArrowLeft',target:firstCategorySummary});
assert.strictEqual(firstCategorySummary.parentNode.open, false, 'Left should collapse a focused category');

var scansBeforeTyping = evalScriptCalls.filter(function (call) { return call.indexOf('scanLocalPresetFolder(') === 0 || call.indexOf('scanLocalPluginFolder(') === 0; }).length;
elements['search-input'].value = 'sh';
elements['search-input'].dispatch('input');
assert.strictEqual(evalScriptCalls.filter(function (call) { return call.indexOf('scanLocalPresetFolder(') === 0 || call.indexOf('scanLocalPluginFolder(') === 0; }).length, scansBeforeTyping, 'typing must not run filesystem scans');
if (perfPresetCount <= 16) assert.ok(elements.results.textContent.indexOf('Camera Shake') !== -1, 'search should show effect and preset name hits');
var shakeRows = elements.results.querySelectorAll('[data-tree-select]');
assert.ok(shakeRows.length >= 2, 'search tree should include the matching effect and preset');
shakeRows[0].click();
assert.strictEqual(shakeRows[0].getAttribute('aria-pressed'), 'true', 'clicking a result should select it');
elements['search-input'].focus();
elements['search-input'].dispatch('keydown', {key:'ArrowDown'});
assert.strictEqual(document.activeElement, shakeRows[0], 'ArrowDown from search should focus the first result');
elements.results.dispatch('keydown', {key:'Escape'});
assert.strictEqual(document.activeElement, elements['search-input'], 'Escape should return focus to search');

elements['search-input'].value = 'no-such-result';
elements['search-input'].dispatch('input');
assert.strictEqual(elements.results.textContent, 'No matches. Try another search.');
elements['search-clear'].click();
assert.strictEqual(elements['search-input'].value, '', 'clear button should clear the query');
assert.ok(elements.results.querySelectorAll('[data-tree-heading]').length, 'clearing search should return to the current browse tree');

elements['search-input'].value = 'preset';
elements['search-input'].dispatch('input');
var more = findByClass(elements.results, 'more-button');
var allPresetQueryMatches = search.search(presetItems.concat(effectItems, pluginItems), 'preset');
assert.strictEqual(more, null, 'search results must not be hidden behind a result-page limit');
assert.strictEqual(elements.results.querySelectorAll('[data-tree-select]').length, allPresetQueryMatches.length, 'the tree must render every eligible preset query match');

elements['search-input'].value = 'shake';
elements['search-input'].dispatch('input');
var shakeMatches = search.search(presetItems.concat(effectItems, pluginItems), 'shake');
assert.strictEqual(elements.results.querySelectorAll('[data-tree-select]').length, shakeMatches.length, 'all-ranked search matches must render together');
['all','effect','plugin','preset'].forEach(function (filter) {
  var tab = filterButtons.filter(function (button) { return button.getAttribute('data-filter') === filter; })[0];
  elements['filter-tabs'].dispatch('click', {target:tab});
  var expected = shakeMatches.filter(function (match) { return filter === 'all' || match.item.type === (filter === 'effect' ? 'effect' : filter === 'plugin' ? 'plugin' : 'preset'); });
  var visibleRows = elements.results.querySelectorAll('[data-tree-select]');
  assert.strictEqual(visibleRows.length, expected.length, 'all eligible shake results should render in the ' + filter + ' tab');
  assert.ok(visibleRows.every(function (row) { return filter === 'all' || row.getAttribute('data-type') === (filter === 'effect' ? 'effect' : filter === 'plugin' ? 'plugin' : 'preset'); }), 'the ' + filter + ' tab should exclude other item types');
});
elements['filter-tabs'].dispatch('click', {target:filterButtons[0]});

elements['search-input'].value = 'my custom preset';
elements['search-input'].dispatch('input');
var highlightedPresetSummary = elements.results.querySelectorAll('[data-tree-heading]').filter(function (summary) { return summary.children[0].textContent === 'Pack 0'; })[0];
assert.ok(highlightedPresetSummary && highlightedPresetSummary.className.indexOf('match-parent') !== -1, 'the first real folder below the preset scan root should be highlighted during search');
var applyButton = findByClass(elements.results, 'apply-preset');
assert.ok(applyButton, 'preset result should preserve its apply action');
applyButton.click();
assert.strictEqual(appliedCalls.length, 1, 'preset row should call the existing host apply method');
assert.strictEqual(confirmationCalls, 0, 'preset Apply must not invoke a JavaScript confirmation');
elements['search-input'].dispatch('input');
var presetRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.textContent.indexOf('My Custom Preset') !== -1; })[0];
assert.ok(presetRow, 'custom preset result should remain searchable');
assert.strictEqual(presetRow.listeners.dblclick.length, 1, 'preset row should have one double-click handler');
presetRow.click();
assert.strictEqual(appliedCalls.length, 1, 'single-click on a preset result must not apply it');
presetRow.dispatch('dblclick', {target:presetRow});
assert.strictEqual(appliedCalls.length, 2, 'double-click should apply a preset result');
assert.strictEqual(confirmationCalls, 0, 'preset double-click must not invoke a JavaScript confirmation');
var presetRowForDrag = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.textContent.indexOf('My Custom Preset') !== -1; })[0];
var presetDragValues = {};
presetRowForDrag.dispatch('dragstart', {dataTransfer:{setData:function (type,value) { presetDragValues[type] = value; }, types:[], effectAllowed:''}});
assert.strictEqual(presetDragValues['com.adobe.cep.dnd.file.0'], 'D:/Custom Presets/Pack 0/Motion/My Custom Preset.ffx', 'preset drag should expose the local file path for host-level testing');
elements['quick-apply-drop'].dispatch('drop', {dataTransfer:{types:['application/x-aeus-result'], getData:function () { return JSON.stringify({type:'preset',key:'preset-1'}); }}});
assert.strictEqual(appliedCalls.length, 3, 'dropping a preset on the in-panel target should use the existing preset bridge');

elements['search-input'].value = 'my custom preset';
elements['search-input'].dispatch('input');
assert.strictEqual(findByClass(elements.results, 'alias-preset'), null, 'preset rows must not expose custom Alias controls');
assert.strictEqual(promptCalls, 0, 'the panel must not open an alias-editing prompt');
elements['search-input'].value = 'easy preset';
elements['search-input'].dispatch('input');
assert.strictEqual(elements.results.querySelectorAll('[data-tree-select]').length, 0, 'retained legacy alias text must no longer affect preset search');
assert.strictEqual(elements.results.querySelectorAll('[data-tree-heading]').some(function (summary) { return summary.className.indexOf('match-parent') !== -1; }), false, 'changing to an empty search result must remove previous highlights');
assert.strictEqual(storageValues['aeus.presetDisplayAliases.v1'], legacyAliasData, 'searching must leave legacy custom alias data untouched');
elements['search-input'].value = 'my custom preset';
elements['search-input'].dispatch('input');
var realNamePresetRow = elements.results.querySelectorAll('[data-tree-select]')[0];
assert.ok(realNamePresetRow && realNamePresetRow.textContent.indexOf('My Custom Preset') !== -1, 'preset remains searchable by its real filename-derived name');
findByClass(elements.results, 'apply-preset').click();
assert.ok(appliedCalls[appliedCalls.length - 1].indexOf('D:/Custom Presets/Pack 0/Motion/My Custom Preset.ffx') !== -1, 'preset application must continue using its original path');
assert.strictEqual(promptCalls, 0, 'normal application must not open an alias-editing prompt');

elements['search-input'].value = 'Camera Shake';
elements['search-input'].dispatch('input');
var effectRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.getAttribute('data-type') === 'effect' && row.textContent.indexOf('Camera Shake') !== -1; })[0];
assert.ok(effectRow, 'effect should be present by its user-facing display name');
assert.strictEqual(effectRow.listeners.dblclick.length, 1, 'one result row should have only one double-click handler');
effectRow.click();
assert.strictEqual(appliedEffectCalls.length, 0, 'single click must only select, never apply');
var effectApplyButton = findByClass(elements.results, 'apply-effect');
assert.ok(effectApplyButton, 'effect result should have an explicit Apply action');
effectRow.dispatch('dblclick', {target:effectRow});
assert.strictEqual(appliedEffectCalls.length, 1, 'double-click should call the effect bridge exactly once');
assert.strictEqual(confirmationCalls, 0, 'effect double-click must not invoke a JavaScript confirmation');
effectRow.dispatch('dblclick', {target:effectApplyButton});
assert.strictEqual(appliedEffectCalls.length, 1, 'double-clicking the Apply control must not duplicate application');
elements['search-input'].dispatch('input');
effectApplyButton = findByClass(elements.results, 'apply-effect');
effectApplyButton.click();
assert.strictEqual(appliedEffectCalls.length, 2, 'the explicit effect Apply action should call the host exactly once');
assert.strictEqual(elements['panel-status'].textContent, 'Effect applied.', 'effect Apply success should use concise status text');
assert.strictEqual(confirmationCalls, 0, 'effect Apply must not invoke a JavaScript confirmation');
effectApplyButton.click();
assert.strictEqual(appliedEffectCalls.length, 2, 'rapid second click on Apply must not apply the effect twice');
elements['search-input'].value = 'Deep Glow';
elements['search-input'].dispatch('input');
effectApplyButton = findByClass(elements.results, 'apply-effect');
deferApplyResponses = true;
effectApplyButton.click();
assert.strictEqual(appliedEffectCalls.length, 3, 'the first delayed Apply request should reach the host once');
elements['search-input'].value = 'Deep Glow';
elements['search-input'].dispatch('input');
effectApplyButton = findByClass(elements.results, 'apply-effect');
effectApplyButton.click();
assert.strictEqual(appliedEffectCalls.length, 3, 'a rerendered result must not issue another Apply while the first host call is pending');
assert.strictEqual(deferredApplyCallbacks.length, 1, 'only one delayed host Apply callback should be pending');
deferredApplyCallbacks.shift()();
deferApplyResponses = false;
elements['search-input'].value = 'My Custom Preset';
elements['search-input'].dispatch('input');
var appliedPresetsBeforeUnlock = appliedCalls.length;
failNextApply = true;
findByClass(elements.results, 'apply-preset').click();
assert.strictEqual(appliedCalls.length, appliedPresetsBeforeUnlock + 1, 'a new Apply action is allowed after the previous host call responds');
assert.strictEqual(elements['panel-status'].textContent, 'Preset could not be applied.', 'a real host failure should have concise user-facing feedback');
assert.strictEqual(elements['panel-status'].title, 'Simulated preset application failure', 'the actual host failure remains available as detail');
assert.strictEqual(elements['local-status'].textContent, 'Simulated preset application failure', 'raw host failure detail remains in the hidden diagnostic element');
elements['search-input'].dispatch('input');
findByClass(elements.results, 'apply-preset').click();
assert.strictEqual(appliedCalls.length, appliedPresetsBeforeUnlock + 2, 'the in-flight guard is released after a failed host response');
assert.strictEqual(elements['panel-status'].textContent, 'Preset applied.', 'preset Apply success should use concise status text');
assert.strictEqual(confirmationCalls, 0, 'failed application reporting must not be replaced with a confirmation dialog');
elements['search-input'].value = 'Camera Shake';
elements['search-input'].dispatch('input');
effectRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.getAttribute('data-type') === 'effect' && row.textContent.indexOf('Camera Shake') !== -1; })[0];
assert.strictEqual(effectRow.draggable, true, 'effect results should expose the drag proof of concept');
var dragValues = {};
effectRow.dispatch('dragstart', {dataTransfer:{setData:function (type,value) { dragValues[type] = value; }, types:[], effectAllowed:''}});
assert.strictEqual(dragValues['application/x-aeus-effect-match-name'], 'Vendor.CameraShake', 'effect drag should carry its host match name for a compatible native target');
assert.ok(dragValues['application/x-aeus-result'], 'effect drag should carry a panel-local result identity');
var dropTransfer = {
  types:['application/x-aeus-result'],
  getData:function (type) { return type === 'application/x-aeus-result' ? JSON.stringify({type:'effect',key:'fx-shake'}) : ''; }
};
elements['quick-apply-drop'].dispatch('dragover', {dataTransfer:dropTransfer});
assert.strictEqual(elements['quick-apply-drop'].className, 'drag-active', 'valid panel drag should highlight the in-panel drop target');
var dragEnterEvent = elements['quick-apply-drop'].dispatch('dragenter', {dataTransfer:dropTransfer});
assert.strictEqual(dragEnterEvent.defaultPrevented, true, 'drop target should explicitly accept a valid dragenter');
var dragOverEvent = elements['quick-apply-drop'].dispatch('dragover', {dataTransfer:dropTransfer});
assert.strictEqual(dragOverEvent.defaultPrevented, true, 'drop target should cancel dragover to accept the drop');
document.dispatch('dragenter', {target:elements['quick-apply-drop'],dataTransfer:dropTransfer});
document.dispatch('dragover', {target:elements['quick-apply-drop'],dataTransfer:dropTransfer});
var diagnosticDropEvent = {target:elements['quick-apply-drop'],clientX:100,clientY:30,composedPath:function () { return [elements['quick-apply-drop'],document]; },dataTransfer:dropTransfer};
document.dispatch('drop', diagnosticDropEvent);
elements['quick-apply-drop'].dispatch('drop', diagnosticDropEvent);
var diagnosticEventAlterations = {preventDefault:0,stopPropagation:0};
document.dispatch('dragleave', {target:elements['quick-apply-drop'],clientX:100,clientY:30,dataTransfer:dropTransfer,preventDefault:function () { diagnosticEventAlterations.preventDefault += 1; },stopPropagation:function () { diagnosticEventAlterations.stopPropagation += 1; }});
var dropPanelStatusBeforeTimers = elements['panel-status'].textContent;
flushWindowTimers();
assert.deepStrictEqual(diagnosticEventAlterations, {preventDefault:0,stopPropagation:0}, 'document diagnostics must not cancel or stop observed events');
assert.strictEqual(appliedEffectCalls.length, 4, 'dropping an effect on the in-panel target should use the existing effect bridge');
assert.ok(evalScriptCalls.indexOf('getApplyTargetStatus()') !== -1, 'drop handling should preflight the active composition and selected layers');
assert.strictEqual(dropPanelStatusBeforeTimers, 'Effect applied.', 'drop success should be summarized in plain language');
assert.ok(elements['local-status'].textContent.indexOf('Apply bridge accepted the request') !== -1, 'raw drop trace remains in the hidden diagnostic element');
assert.ok(elements['drag-diagnostic-status'].textContent.indexOf('selected layers 1') !== -1, 'detailed selection trace should remain available in hidden diagnostic storage');
var dragLogEntries = dragDiagnosticContents.trim().split(/\r?\n/).map(function (line) { return JSON.parse(line); });
['diagnostic-log-ready','drag-started','dragenter-on-searchy-drop-target','dragover-on-searchy-drop-target','drop-event-inside-searchy','drop-event-received-by-searchy','payload-decoded-successfully','item-identified','composition-and-layer-check-passed','host-application-request-sent','host-response-received'].forEach(function (stage) {
  assert.ok(dragLogEntries.some(function (entry) { return entry.stage === stage; }), 'persistent drag log should include ' + stage);
});
['document-dragenter-capture','document-dragenter-after-dispatch','document-dragleave-capture','document-dragleave-after-dispatch','document-drop-capture','document-drop-after-dispatch'].forEach(function (stage) {
  assert.ok(dragLogEntries.some(function (entry) { return entry.stage === stage; }), 'persistent drag log should include observational event record ' + stage);
});
var dragOverBatch = dragLogEntries.filter(function (entry) { return entry.stage === 'document-dragover-observation-batch'; })[0];
assert.ok(dragOverBatch && dragOverBatch.details.eventCount >= 1, 'persistent drag log should batch dragover observations without losing event records');
['document-dragover-capture','document-dragover-after-dispatch'].forEach(function (stage) {
  assert.ok(dragOverBatch.details.records.some(function (entry) { return entry.stage === stage; }), 'dragover batch should include ' + stage);
});
var capturedDrop = dragLogEntries.filter(function (entry) { return entry.stage === 'document-drop-capture'; })[0];
var afterDrop = dragLogEntries.filter(function (entry) { return entry.stage === 'document-drop-after-dispatch'; })[0];
assert.strictEqual(capturedDrop.details.observation.clientX, 100, 'capture diagnostic should record pointer X');
assert.strictEqual(capturedDrop.details.observation.coordinatesInsideDropTarget, true, 'capture diagnostic should test the live drop-target rectangle');
assert.strictEqual(capturedDrop.details.observation.elementFromPoint.id, 'quick-apply-drop', 'capture diagnostic should record elementFromPoint');
assert.deepStrictEqual(capturedDrop.details.observation.dataTransferTypes, ['application/x-aeus-result'], 'capture diagnostic should record payload MIME types');
assert.strictEqual(afterDrop.details.defaultPreventedAfterHandlers, true, 'after-dispatch diagnostic should observe the target handler cancellation');
var loggedRequest = dragLogEntries.filter(function (entry) { return entry.stage === 'host-application-request-sent' && entry.details.itemType === 'effect'; })[0];
assert.strictEqual(loggedRequest.details.matchName, 'Vendor.CameraShake', 'diagnostic request should preserve the effect identifier separately');

// A drop arriving while a normal Apply is awaiting the host must be rejected by the same panel-wide guard.
elements['search-input'].value = 'Deep Glow';
elements['search-input'].dispatch('input');
effectApplyButton = findByClass(elements.results, 'apply-effect');
deferApplyResponses = true;
effectApplyButton.click();
var callsBeforeBlockedDrop = appliedEffectCalls.length;
effectRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.getAttribute('data-key') === 'fx-deep-glow'; })[0];
effectRow.dispatch('dragstart', {dataTransfer:{setData:function () {}, types:[], effectAllowed:''}});
elements['quick-apply-drop'].dispatch('drop', {dataTransfer:{types:['application/x-aeus-result'], getData:function () { return JSON.stringify({type:'effect',key:'fx-deep-glow'}); }}});
assert.strictEqual(appliedEffectCalls.length, callsBeforeBlockedDrop, 'drop must not issue a second host request while Apply is pending');
assert.ok(dragDiagnosticContents.indexOf('duplicate-request-blocked') !== -1, 'blocked duplicate drop must be persisted in diagnostics');
deferredApplyCallbacks.shift()();
deferApplyResponses = false;
effectRow.dispatch('dragend', {dataTransfer:{dropEffect:'copy'}});

// A panel drop over results is accepted and routed through the existing Apply bridge.
elements['search-input'].value = 'Deep Glow';
elements['search-input'].dispatch('input');
effectRow = elements.results.querySelectorAll('[data-tree-select]').filter(function (row) { return row.getAttribute('data-key') === 'fx-deep-glow'; })[0];
effectRow.dispatch('dragstart', {dataTransfer:{setData:function () {}, types:[], effectAllowed:''}});
var panelEffectDropCalls = appliedEffectCalls.length;
var dropOutsideHintTransfer = {
  types:['application/x-aeus-result'], dropEffect:'none',
  getData:function (type) { return type === 'application/x-aeus-result' ? JSON.stringify({type:'effect',key:'fx-deep-glow'}) : ''; }
};
var acceptedPanelOver = document.dispatch('dragover', {target:elements.results,dataTransfer:dropOutsideHintTransfer});
assert.strictEqual(acceptedPanelOver.defaultPrevented, true, 'drop over a result row should be accepted by the panel-wide handler');
document.dispatch('drop', {target:elements.results,dataTransfer:dropOutsideHintTransfer});
assert.strictEqual(appliedEffectCalls.length, panelEffectDropCalls + 1, 'a panel-wide effect drop should route through Apply once');
effectRow.dispatch('dragend', {dataTransfer:{dropEffect:'copy'}});
assert.ok(dragDiagnosticContents.indexOf('drag-ended-inside-searchy-outside-target') !== -1, 'panel drop outside the target must not be mislabeled as outside Searchy');

var appliesBeforeAddFolder = appliedCalls.length + appliedEffectCalls.length;
elements['settings-toggle'].click();
elements['add-preset-folder'].click();
assert.ok(storageValues[folders.storageKey].indexOf('E:/My Presets') !== -1, 'folder chooser should persist the selected custom folder');
assert.ok(evalScriptCalls.some(function (call) { return call.indexOf('scanLocalPresetFolder(') === 0; }), 'preset scans should use the existing host scan bridge');
assert.strictEqual(elements['settings-menu'].hidden, true, 'Add Folder should close the settings menu');
assert.strictEqual(appliedCalls.length + appliedEffectCalls.length, appliesBeforeAddFolder, 'Add Folder must not apply a result');

if (perfPresetCount > 16) {
  var perfQueries = ['Deep Glow', 'Glow Dee', 'glow', 'sh', 'shake', "Jarle's Deadpool Handheld Camera Long Lens", 'no-matches-expected'];
  perfQueries.forEach(function (query) {
    var overall = [];
    var searchTimes = [];
    var treeTimes = [];
    var domTimes = [];
    var domCounts = [];
    var residualTimes = [];
    var treeIndexBuildsBefore = treeIndexBuilds;
    var matchesForQuery;
    var aliasReadsBefore = legacyAliasStorageReads;
    perf.maxSearchTreeItems = 0;
    for (var repeat = 0; repeat < 5; repeat += 1) {
      perf.searchMs = 0; perf.treeMs = 0; perf.domMutationMs = 0; perf.domMutations = 0;
      elements['search-input'].value = query;
      perf.active = true;
      var start = process.hrtime.bigint();
      elements['search-input'].dispatch('input');
      overall.push(elapsedMs(start));
      perf.active = false;
      searchTimes.push(perf.searchMs);
      treeTimes.push(perf.treeMs);
      domTimes.push(perf.domMutationMs);
      domCounts.push(perf.domMutations);
      residualTimes.push(overall[overall.length - 1] - perf.searchMs - perf.treeMs);
    }
    matchesForQuery = search.search(presetItems.concat(effectItems, pluginItems), query);
    if (profileRoot === path.resolve(__dirname, '..')) assert.strictEqual(legacyAliasStorageReads, aliasReadsBefore, 'typing must not read retained legacy alias storage');
    if (profileRoot === path.resolve(__dirname, '..')) assert.strictEqual(elements.results.querySelectorAll('[data-tree-select]').length, matchesForQuery.length, 'search rendering must include every match for ' + query);
    if (profileRoot === path.resolve(__dirname, '..')) assert.strictEqual(treeIndexBuilds, treeIndexBuildsBefore, 'typing must reuse the cached tree index');
    assert.strictEqual(elements['result-count'].textContent, matchesForQuery.length + (matchesForQuery.length === 1 ? ' match' : ' matches'), 'result count should reflect all matches for ' + query);
    if (query === 'Glow Dee') assert.ok(matchesForQuery.some(function (match) { return match.item.name === 'Deep Glow'; }), 'reordered partial multiword query should find Deep Glow');
    if (query === 'no-matches-expected') assert.strictEqual(matchesForQuery.length, 0, 'no-match query should remain empty');
    console.log('PROFILE ' + JSON.stringify({ query:query, catalogueItems:presetItems.length + effectItems.length + pluginItems.length, matches:matchesForQuery.length, renderedRows:elements.results.querySelectorAll('[data-tree-select]').length, medianInputHandlerMs:timedQueryStats(overall), medianSearchMs:timedQueryStats(searchTimes), medianTreeBuildMs:timedQueryStats(treeTimes), medianControllerAndMockRenderMs:timedQueryStats(residualTimes), medianMockDomMutationMs:timedQueryStats(domTimes), medianMockDomMutationCount:timedQueryStats(domCounts), maxSearchTreeItems:perf.maxSearchTreeItems }));
  });
}

// Panel-wide drop acceptance: valid Searchy items apply anywhere; unrelated or malformed payloads do not.
elements['search-input'].value = 'Camera Shake';
elements['search-input'].dispatch('input');
var panelPresetTransfer = {
  types:['application/x-aeus-result'], dropEffect:'none',
  getData:function (type) { return type === 'application/x-aeus-result' ? JSON.stringify({type:'preset',key:'preset-1'}) : ''; }
};
var panelPresetOver = document.dispatch('dragover', {target:elements.results,dataTransfer:panelPresetTransfer});
assert.strictEqual(panelPresetOver.defaultPrevented, true, 'panel-wide dragover must accept a Searchy payload outside the hint row');
assert.strictEqual(panelPresetTransfer.dropEffect, 'copy', 'panel-wide dragover should request a copy operation');
var panelPresetCalls = appliedCalls.length;
var panelPresetDrop = {target:elements.results,dataTransfer:panelPresetTransfer};
document.dispatch('drop', panelPresetDrop);
document.dispatch('drop', panelPresetDrop);
assert.strictEqual(appliedCalls.length, panelPresetCalls + 1, 'dropping a preset elsewhere in Searchy should apply once even if the event is delivered twice');

var panelEffectTransfer = {
  types:['application/x-aeus-result'],
  getData:function (type) { return type === 'application/x-aeus-result' ? JSON.stringify({type:'effect',key:'fx-shake'}) : ''; }
};
var panelEffectCalls = appliedEffectCalls.length;
document.dispatch('drop', {target:elements['search-input'],dataTransfer:panelEffectTransfer});
assert.strictEqual(appliedEffectCalls.length, panelEffectCalls + 1, 'dropping an effect over another panel control should use the existing effect bridge');

var unsupportedTransfer = {types:['text/plain'],getData:function () { return 'not Searchy'; }};
var unsupportedOver = document.dispatch('dragover', {target:elements.results,dataTransfer:unsupportedTransfer});
assert.strictEqual(!!unsupportedOver.defaultPrevented, false, 'unsupported drag payloads must not be accepted by Searchy');
var callsBeforeMalformed = appliedEffectCalls.length + appliedCalls.length;
var malformedTransfer = {types:['application/x-aeus-result'],getData:function () { return '{invalid-json'; }};
var malformedDrop = {target:elements.results,dataTransfer:malformedTransfer};
document.dispatch('drop', malformedDrop);
document.dispatch('drop', malformedDrop);
assert.strictEqual(appliedEffectCalls.length + appliedCalls.length, callsBeforeMalformed, 'malformed Searchy payloads must not call either application bridge');
assert.ok(dragDiagnosticContents.indexOf('payload-decode-failed') !== -1, 'malformed payloads should leave a diagnostic failure');

function findByClass(root, className) {
  var found = null;
  function visit(node) {
    if (node.className && String(node.className).split(/\s+/).indexOf(className) !== -1) found = node;
    node.children.forEach(function (child) { if (!found) visit(child); });
  }
  visit(root);
  return found;
}

console.log('PASS: panel browse/search tree, complete match rendering, expand/collapse, selection, keyboard focus, empty state, apply bridge, and custom-folder persistence using a simulated CEP DOM/host.');
