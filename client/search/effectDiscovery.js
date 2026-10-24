(function (root, factory) {
  var discovery = factory();
  if (typeof module === 'object' && module.exports) module.exports = discovery;
  else root.AEUSEffectDiscovery = discovery;
}(this, function () {
  function parseResponse(raw) {
    var payload;
    if (typeof raw !== 'string' || !raw) {
      return { ok: false, error: 'After Effects returned an empty response.', items: [] };
    }
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      return { ok: false, error: 'Could not read the effect list returned by After Effects.', items: [] };
    }
    if (!payload || payload.ok !== true || !Array.isArray(payload.items)) {
      return { ok: false, error: payload && payload.error ? payload.error : 'After Effects did not return an effect list.', items: [] };
    }
    return {
      ok: true,
      source: payload.source || 'app.effects',
      hostVersion: payload.hostVersion || '',
      count: payload.items.length,
      items: payload.items.map(function (item) {
        var matchName = String(item.matchName || '');
        var displayName = item.displayName != null ? String(item.displayName) : String(item.name || '');
        // Older payloads may only have `name`; do not let a copied internal identifier become a visible label.
        if (item.displayName == null && matchName && displayName === matchName) displayName = '';
        return {
          id: String(item.id || item.matchName || displayName || ''),
          // Never promote the internal matchName into the visible label.
          name: displayName || 'Unnamed effect',
          displayName: displayName,
          displayNameAvailable: item.displayNameAvailable === true || !!displayName,
          matchName: matchName,
          category: String(item.category || ''),
          version: String(item.version || ''),
          type: 'effect',
          source: 'After Effects app.effects',
          discoveryStatus: 'discovered',
          hostListed: item.hostListed === true,
          availability: 'not-verified',
          applicability: 'not-tested'
        };
      })
    };
  }
  return { parseResponse: parseResponse };
}));
