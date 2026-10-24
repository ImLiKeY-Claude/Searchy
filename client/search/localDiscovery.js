(function (root, factory) {
  var discovery = factory();
  if (typeof module === 'object' && module.exports) module.exports = discovery;
  else root.AEUSLocalDiscovery = discovery;
}(this, function () {
  var storageKey = 'aeus.customPresetFolders.v1';

  function normalizePath(value) {
    return String(value || '').replace(/^\s+|\s+$/g, '').replace(/\\/g, '/').replace(/\/+$/, '');
  }

  function parseFolders(value) {
    var parsed;
    var seen = {};
    var output = [];
    var i;
    var path;
    if (typeof value === 'string') {
      try { parsed = JSON.parse(value); } catch (error) { return []; }
    } else parsed = value;
    if (!Array.isArray(parsed)) return [];
    for (i = 0; i < parsed.length; i += 1) {
      path = normalizePath(parsed[i]);
      if (!path) continue;
      if (seen[path.toLowerCase()]) continue;
      seen[path.toLowerCase()] = true;
      output.push(path);
    }
    return output;
  }

  function readFolders(storage) {
    try { return parseFolders(storage.getItem(storageKey) || '[]'); }
    catch (error) { return []; }
  }

  function writeFolders(storage, folders) {
    var normalized = parseFolders(folders);
    try { storage.setItem(storageKey, JSON.stringify(normalized)); }
    catch (error) { return { ok: false, folders: normalized, error: 'Could not save custom preset folders in this CEP panel.' }; }
    return { ok: true, folders: normalized };
  }

  function addFolder(storage, path) {
    var folders = readFolders(storage);
    folders.push(path);
    return writeFolders(storage, folders);
  }

  function removeFolder(storage, path) {
    var target = normalizePath(path).toLowerCase();
    return writeFolders(storage, readFolders(storage).filter(function (entry) {
      return entry.toLowerCase() !== target;
    }));
  }

  function relativePath(path, rootPath) {
    var full = normalizePath(path);
    var root = normalizePath(rootPath);
    if (root && full.toLowerCase().indexOf(root.toLowerCase() + '/') === 0) return full.slice(root.length + 1);
    return full;
  }

  function filenameLabel(fileName) {
    return String(fileName || '').replace(/\.ffx$/i, '');
  }

  function parseResponse(raw, expectedType, rootPath) {
    var payload;
    var items;
    if (typeof raw !== 'string' || !raw) return { ok: false, error: 'After Effects returned an empty response.', items: [] };
    try { payload = JSON.parse(raw); }
    catch (error) { return { ok: false, error: 'Could not read the local file list returned by After Effects.', items: [] }; }
    if (!payload || payload.ok !== true || !Array.isArray(payload.items)) {
      return { ok: false, error: payload && payload.error ? payload.error : 'After Effects did not return a local file list.', items: [] };
    }
    items = payload.items.filter(function (item) {
      return item && item.path && item.name && item.type === expectedType;
    }).map(function (item) {
      return {
        id: String(item.id || item.path).toLowerCase(),
        name: expectedType === 'preset' ? filenameLabel(item.fileName || item.name) : String(item.name),
        fileName: String(item.fileName || item.name),
        path: String(item.path),
        rootPath: normalizePath(rootPath),
        relativePath: relativePath(item.path, rootPath),
        source: String(item.source || 'Local folder'),
        type: expectedType,
        availability: 'file-present',
        applicationStatus: 'not-tested'
      };
    });
    return { ok: true, count: items.length, items: items };
  }

  return {
    storageKey: storageKey,
    normalizePath: normalizePath,
    parseFolders: parseFolders,
    readFolders: readFolders,
    addFolder: addFolder,
    removeFolder: removeFolder,
    relativePath: relativePath,
    filenameLabel: filenameLabel,
    parseResponse: parseResponse
  };
}));
