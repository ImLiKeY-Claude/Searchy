var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var source = fs.readFileSync(require.resolve('../host.jsx'), 'utf8');

function CompItem() {}
function createContext(options) {
  options = options || {};
  var added = [];
  var beginCount = 0;
  var endCount = 0;
  var layer = {
    name: 'Verification Layer',
    property: function (name) {
      assert.strictEqual(name, 'ADBE Effect Parade');
      if (options.noParade) return null;
      return { addProperty: function (matchName) {
        added.push(matchName);
        if (options.addError) throw new Error(options.addError);
        return { matchName: options.wrongAddedMatchName || matchName };
      } };
    }
  };
  var comp = new CompItem();
  comp.name = 'Verification Comp';
  comp.typeName = 'Composition';
  comp.selectedLayers = options.noSelection ? [] : [layer];
  var context = {
    CompItem: CompItem,
    app: {
      version: '26.3',
      effects: options.effects || [{ displayName: 'Deep Glow', matchName: 'Vendor.DeepGlow', category: 'Stylize', version: '1.0' }],
      project: options.noComp ? { activeItem: null } : { activeItem: comp },
      beginUndoGroup: function () { beginCount += 1; },
      endUndoGroup: function () { endCount += 1; }
    }
  };
  vm.runInNewContext(source, context);
  return { context: context, added: added, counts: function () { return { begin: beginCount, end: endCount }; } };
}

var setup = createContext();
var targetStatus = JSON.parse(setup.context.getApplyTargetStatus());
assert.strictEqual(targetStatus.activeItemIsComp, true);
assert.strictEqual(targetStatus.activeItemName, 'Verification Comp');
assert.strictEqual(targetStatus.selectedLayerCount, 1);
assert.deepStrictEqual(targetStatus.selectedLayerNames, ['Verification Layer']);
var missingTargetStatus = JSON.parse(createContext({noComp:true}).context.getApplyTargetStatus());
assert.strictEqual(missingTargetStatus.activeItemIsComp, false);
assert.strictEqual(missingTargetStatus.selectedLayerCount, 0);
var result = JSON.parse(setup.context.applyEffectToSelectedLayers('Vendor.DeepGlow'));
assert.strictEqual(result.ok, true);
assert.strictEqual(result.displayName, 'Deep Glow');
assert.strictEqual(result.matchName, 'Vendor.DeepGlow');
assert.strictEqual(result.appliedCount, 1);
assert.strictEqual(result.resultVerified, false, 'a successful scripting call is not a visual verification');
assert.deepStrictEqual(setup.added, ['Vendor.DeepGlow']);
assert.deepStrictEqual(setup.counts(), {begin:1,end:1});

assert.strictEqual(JSON.parse(setup.context.applyEffectToSelectedLayers('')).stage, 'validation');
assert.strictEqual(JSON.parse(setup.context.applyEffectToSelectedLayers('Missing.Effect')).stage, 'availability');
assert.strictEqual(JSON.parse(createContext({noComp:true}).context.applyEffectToSelectedLayers('Vendor.DeepGlow')).stage, 'selection');
assert.strictEqual(JSON.parse(createContext({noSelection:true}).context.applyEffectToSelectedLayers('Vendor.DeepGlow')).stage, 'selection');

var failed = createContext({addError:'Plug-in rejected effect'});
var failedResult = JSON.parse(failed.context.applyEffectToSelectedLayers('Vendor.DeepGlow'));
assert.strictEqual(failedResult.ok, false);
assert.strictEqual(failedResult.error, 'Error: Plug-in rejected effect');
assert.deepStrictEqual(failed.counts(), {begin:1,end:1}, 'undo group must close after host errors');

var mismatched = createContext({wrongAddedMatchName:'Other.Effect'});
var mismatchResult = JSON.parse(mismatched.context.applyEffectToSelectedLayers('Vendor.DeepGlow'));
assert.strictEqual(mismatchResult.ok, false, 'reject an effect object that does not match the requested host identifier');

console.log('PASS: exact host effect identification, display-name separation, composition/layer validation, and effect application error paths using simulated After Effects objects (not an in-app test).');
