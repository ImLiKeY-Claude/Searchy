var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var source = fs.readFileSync(require.resolve('../host.jsx'), 'utf8');
var context = { app: {
  version: '26.3',
  effects: [
    { displayName: 'Effect "One"', matchName: 'ADBE Test\\One', category: 'Test\nCategory', version: '1.2' },
    { displayName: 'Duplicate', matchName: 'ADBE Test\\One', category: 'Test', version: '1.2' },
    { displayName: 'Vendor_Internal_Name', matchName: 'Vendor_Internal_Name', category: 'Test', version: '1.0' }
  ]
} };

vm.runInNewContext(source, context);
var response = JSON.parse(context.getEffectCatalogue());
assert.strictEqual(response.ok, true);
assert.strictEqual(response.hostVersion, '26.3');
assert.strictEqual(response.count, 2);
assert.strictEqual(response.items[0].name, 'Effect "One"');
assert.strictEqual(response.items[0].displayName, 'Effect "One"');
assert.strictEqual(response.items[0].displayNameAvailable, true);
assert.strictEqual(response.items[0].matchName, 'ADBE Test\\One');
assert.strictEqual(response.items[0].category, 'Test\nCategory');
assert.strictEqual(response.items[0].hostListed, true);
assert.strictEqual(response.items[0].availability, 'not-verified');
assert.strictEqual(response.items[0].applicability, 'not-tested');

var noDisplayContext = { app: { version: '26.3', effects: [{ displayName: '', matchName: 'Vendor_Internal_Name' }] } };
vm.runInNewContext(source, noDisplayContext);
var noDisplayResponse = JSON.parse(noDisplayContext.getEffectCatalogue());
assert.strictEqual(noDisplayResponse.items[0].name, '', 'host serialization must not invent a name from matchName');
assert.strictEqual(noDisplayResponse.items[0].matchName, 'Vendor_Internal_Name');
assert.strictEqual(noDisplayResponse.items[0].displayNameAvailable, false);

console.log('PASS: host response serialization and duplicate filtering using a simulated effects list (not an After Effects runtime test).');
