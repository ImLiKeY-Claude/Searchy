(function (root, factory) {
  var searchEngine = factory();
  if (typeof module === 'object' && module.exports) module.exports = searchEngine;
  else root.AEUSSearch = searchEngine;
}(this, function () {
  function normalize(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').toLowerCase();
  }

  function wordStartIndex(value, query) {
    var at = value.indexOf(query);
    while (at !== -1) {
      if (at === 0 || /[\s\-_./\\]/.test(value.charAt(at - 1))) return at;
      at = value.indexOf(query, at + 1);
    }
    return -1;
  }

  function firstScore(values, query, exactScore, prefixScore, wordScore, containsScore, field) {
    var i;
    var value;
    for (i = 0; i < values.length; i += 1) {
      value = normalize(values[i]);
      if (!value) continue;
      if (value === query) return { score: exactScore, field: field + '-exact' };
      if (value.indexOf(query) === 0) return { score: prefixScore, field: field + '-prefix' };
      if (wordStartIndex(value, query) !== -1) return { score: wordScore, field: field + '-word-start' };
      if (value.indexOf(query) !== -1) return { score: containsScore, field: field + '-contains' };
    }
    return null;
  }

  function allNameTokensScore(values, query) {
    var tokens = query.split(/\s+/);
    var i;
    var j;
    var value;
    var found;
    if (tokens.length < 2) return null;
    for (i = 0; i < values.length; i += 1) {
      value = normalize(values[i]);
      if (!value) continue;
      found = true;
      for (j = 0; j < tokens.length; j += 1) {
        if (wordStartIndex(value, tokens[j]) === -1) { found = false; break; }
      }
      if (found) return { score: 350, field: 'name-all-terms' };
    }
    return null;
  }

  function bestMatch(item, query) {
    var match = firstScore([item.name, item.fileName], query, 600, 500, 450, 400, 'name');
    if (match) return match;
    // Permit multiword searches in any order, while keeping contiguous name matches stronger.
    match = allNameTokensScore([item.name, item.fileName], query);
    if (match) return match;
    match = firstScore(item.aliases || [], query, 300, 290, 280, 270, 'alias');
    if (match) return match;
    match = firstScore(item.tags || [], query, 200, 190, 180, 170, 'tag');
    if (match) return match;
    match = firstScore([item.matchName, item.category, item.version, item.source, item.path], query, 80, 75, 70, 65, 'metadata');
    return match;
  }

  function search(items, query) {
    var normalizedQuery = normalize(query);
    var matches = [];
    var i;
    var match;
    if (!normalizedQuery || !items || !items.length) return matches;
    for (i = 0; i < items.length; i += 1) {
      match = bestMatch(items[i], normalizedQuery);
      if (match) matches.push({ item: items[i], score: match.score, matchField: match.field });
    }
    matches.sort(function (left, right) {
      if (right.score !== left.score) return right.score - left.score;
      var leftName = normalize(left.item.name || left.item.fileName);
      var rightName = normalize(right.item.name || right.item.fileName);
      if (leftName < rightName) return -1;
      if (leftName > rightName) return 1;
      return String(left.item.id || '').localeCompare(String(right.item.id || ''));
    });
    return matches;
  }

  return { normalize: normalize, search: search, bestMatch: bestMatch };
}));
