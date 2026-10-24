var assert = require('assert');
var discovery = require('../client/search/effectDiscovery');

var parsed = discovery.parseResponse(JSON.stringify({
  ok: true,
  source: 'app.effects',
  hostVersion: '26.3',
  items: [{
    id: 'ADBE Gaussian Blur 2',
    name: 'Gaussian Blur',
    displayName: 'Gaussian Blur',
    matchName: 'ADBE Gaussian Blur 2',
    category: 'Blur & Sharpen',
    version: '2.0',
    hostListed: true,
    applicability: 'not-tested'
  }]
}));

assert.strictEqual(parsed.ok, true);
assert.strictEqual(parsed.count, 1);
assert.strictEqual(parsed.items[0].name, 'Gaussian Blur');
assert.strictEqual(parsed.items[0].displayName, 'Gaussian Blur');
assert.strictEqual(parsed.items[0].hostListed, true);
assert.strictEqual(parsed.items[0].availability, 'not-verified');
assert.strictEqual(parsed.items[0].applicability, 'not-tested');

assert.strictEqual(discovery.parseResponse('').ok, false);
assert.strictEqual(discovery.parseResponse('not JSON').ok, false);
assert.strictEqual(discovery.parseResponse('{"ok":false,"error":"API unavailable","items":[]}').error, 'API unavailable');

var noDisplayName = discovery.parseResponse(JSON.stringify({ok:true,items:[{
  id:'Vendor_Internal_Identifier', name:'', displayName:'', matchName:'Vendor_Internal_Identifier', hostListed:true
}]}));
assert.strictEqual(noDisplayName.items[0].name, 'Unnamed effect', 'internal identifiers must never become visible fallback labels');
assert.strictEqual(noDisplayName.items[0].displayNameAvailable, false);
assert.strictEqual(noDisplayName.items[0].matchName, 'Vendor_Internal_Identifier', 'keep the identifier separately');
var legacyIdentifier = discovery.parseResponse(JSON.stringify({ok:true,items:[{
  id:'Vendor_Internal_Identifier', name:'Vendor_Internal_Identifier', matchName:'Vendor_Internal_Identifier'
}]}));
assert.strictEqual(legacyIdentifier.items[0].name, 'Unnamed effect', 'legacy payloads must not expose a copied matchName as display text');

console.log('PASS: effect discovery response parsing and availability/applicability labels.');
