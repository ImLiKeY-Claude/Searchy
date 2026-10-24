(function (root, factory) {
  var resultTree = factory();
  if (typeof module === 'object' && module.exports) module.exports = resultTree;
  else root.AEUSResultTree = resultTree;
}(this, function () {
  function normalize(path) { return String(path || '').replace(/\\/g, '/').replace(/\/+$/, ''); }
  function parentPath(path) {
    var normalized = normalize(path);
    var slash = normalized.lastIndexOf('/');
    return slash > 0 ? normalized.slice(0, slash) : '';
  }
  function leafName(path) {
    var normalized = normalize(path);
    var slash = normalized.lastIndexOf('/');
    return slash >= 0 ? normalized.slice(slash + 1) : normalized;
  }
  function createRoot(id, label, order) {
    return { id: id, key: id, label: label, title: label, order: order, children: [], items: [], maxScore: -1, fileCount: 0 };
  }
  function findGroup(groups, key, label, title) {
    var lookup = groups._aeusLookup || (groups._aeusLookup = {});
    var lookupKey = '$' + key;
    if (lookup[lookupKey]) return lookup[lookupKey];
    var group = { key: key, label: label, title: title || label, items: [], children: [], maxScore: -1, fileCount: 0 };
    groups.push(group);
    lookup[lookupKey] = group;
    return group;
  }
  function addPathItems(root, match, path, searching) {
    var normalized = normalize(path);
    var parts = normalized ? normalized.split('/') : [];
    var folders = parts.slice(0, -1);
    var parent = root;
    var i;
    var segment;
    var accumulated = '';
    var group;
    var firstGroup = null;
    for (i = 0; i < folders.length; i += 1) {
      segment = folders[i];
      if (!segment) continue;
      accumulated += (accumulated ? '/' : '') + segment;
      group = findGroup(parent.children, 'folder:' + accumulated.toLowerCase(), segment, accumulated);
      if (!firstGroup) firstGroup = group;
      parent = group;
    }
    parent.items.push(match);
    if (match.score > parent.maxScore) parent.maxScore = match.score;
    if (searching) (firstGroup || root).matchParent = true;
  }
  function createIndex(items) {
    var roots = {};
    var counts = {};
    var labels = {};
    var list = items || [];
    var i;
    var item;
    var path;
    var pathKey;
    var labelKey;
    var label;
    for (i = 0; i < list.length; i += 1) {
      item = list[i];
      if (!item || item.type !== 'preset' || !item.rootPath) continue;
      path = normalize(item.rootPath);
      pathKey = '$' + path.toLowerCase();
      if (roots[pathKey]) continue;
      roots[pathKey] = path;
      label = leafName(path) || 'Preset folder';
      labelKey = '$' + label.toLowerCase();
      counts[labelKey] = (counts[labelKey] || 0) + 1;
    }
    Object.keys(roots).forEach(function (key) {
      path = roots[key];
      label = leafName(path) || 'Preset folder';
      labels[key] = counts['$' + label.toLowerCase()] > 1 ? label + ' — ' + path : label;
    });
    return { presetRootLabels: labels };
  }
  function displayRootName(rootPath, index) {
    var normalized = normalize(rootPath);
    var key = '$' + normalized.toLowerCase();
    return index && index.presetRootLabels && index.presetRootLabels[key] || leafName(normalized) || 'Preset folder';
  }
  function build(items, matches, searching, index) {
    var roots = [createRoot('presets', 'Presets', 0), createRoot('plugins', 'Plug-in Files', 1), createRoot('effects', 'Host Effects', 2)];
    var source = searching ? matches || [] : (items || []).map(function (item) { return { item: item, score: 0, matchField: '' }; });
    var all = items || [];
    var i;
    var match;
    var item;
    var rootNode;
    var category;
    var group;
    var rootPath;
    var relative;
    index = index || createIndex(all);
    for (i = 0; i < source.length; i += 1) {
      match = source[i];
      item = match.item;
      if (!item) continue;
      rootNode = item.type === 'preset' ? roots[0] : (item.type === 'plugin' ? roots[1] : roots[2]);
      if (rootNode.id === 'effects' && String(item.category || '').replace(/\s/g, '')) {
        category = String(item.category).replace(/^\s+|\s+$/g, '');
        group = findGroup(rootNode.children, 'category:' + category.toLowerCase(), category, category);
        group.items.push(match);
        if (match.score > group.maxScore) group.maxScore = match.score;
        if (searching) group.matchParent = true;
      } else if (rootNode.id === 'presets' && item.rootPath) {
        rootPath = normalize(item.rootPath);
        group = findGroup(rootNode.children, 'preset-root:' + rootPath.toLowerCase(), displayRootName(rootPath, index), rootPath);
        relative = item.relativePath || item.fileName || item.name;
        addPathItems(group, match, relative, searching);
      } else if (rootNode.id === 'plugins' && item.rootPath && (relative = item.relativePath)) {
        rootPath = normalize(item.rootPath);
        group = findGroup(rootNode.children, 'plugin-root:' + rootPath.toLowerCase(), displayRootName(rootPath, index), rootPath);
        addPathItems(group, match, relative, searching);
      } else if (rootNode.id === 'presets' && (relative = item.path)) {
        rootPath = parentPath(relative);
        group = findGroup(rootNode.children, 'preset-folder:' + rootPath.toLowerCase(), leafName(rootPath), rootPath);
        group.items.push(match);
        if (match.score > group.maxScore) group.maxScore = match.score;
        if (searching) group.matchParent = true;
      } else if (rootNode.id === 'plugins' && (relative = item.path)) {
        rootPath = parentPath(relative);
        group = findGroup(rootNode.children, 'plugin-folder:' + rootPath.toLowerCase(), leafName(rootPath), rootPath);
        group.items.push(match);
        if (match.score > group.maxScore) group.maxScore = match.score;
        if (searching) group.matchParent = true;
      } else if (rootNode.id !== 'effects' && (relative = item.relativePath || item.path)) {
        addPathItems(rootNode, match, relative, searching);
      } else rootNode.items.push(match);
      if (match.score > rootNode.maxScore) rootNode.maxScore = match.score;
    }
    function sortAndCount(node) {
      node.items.sort(function (left, right) {
        if (searching && right.score !== left.score) return right.score - left.score;
        return String(left.item.name || left.item.fileName || '').toLowerCase().localeCompare(String(right.item.name || right.item.fileName || '').toLowerCase());
      });
      node.children.forEach(sortAndCount);
      node.children.forEach(function (child) { if (child.maxScore > node.maxScore) node.maxScore = child.maxScore; });
      node.children.sort(function (left, right) {
        if (searching && right.maxScore !== left.maxScore) return right.maxScore - left.maxScore;
        return left.label.toLowerCase().localeCompare(right.label.toLowerCase());
      });
      node.fileCount = node.items.length + node.children.reduce(function (sum, child) { return sum + child.fileCount; }, 0);
    }
    roots.forEach(sortAndCount);
    return roots;
  }
  return { build: build, createIndex: createIndex, parentPath: parentPath, leafName: leafName };
}));
