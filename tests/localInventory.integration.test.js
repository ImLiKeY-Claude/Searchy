var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var hostSource = fs.readFileSync(require.resolve('../host.jsx'), 'utf8');

function DiskFolder(folderPath) {
  this.fsName = folderPath;
  this.name = path.basename(folderPath);
  this.exists = fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
  this.alias = false;
  this.parent = folderPath === path.dirname(folderPath) ? null : new DiskFolder(path.dirname(folderPath));
}
DiskFolder.prototype.getFiles = function () {
  if (!this.exists) return [];
  return fs.readdirSync(this.fsName).map(function (name) {
    var fullPath = path.join(this.fsName, name);
    var stat = fs.statSync(fullPath);
    return stat.isDirectory() ? new DiskFolder(fullPath) : new DiskFile(fullPath);
  }, this);
};
function Folder(folderPath) { return new DiskFolder(folderPath); }
Folder.prototype = DiskFolder.prototype;
function DiskFile(filePath) {
  this.fsName = filePath;
  this.name = path.basename(filePath);
  this.exists = fs.existsSync(filePath);
  this.alias = false;
}
function File(filePath) { return new DiskFile(filePath); }
File.prototype = DiskFile.prototype;

var installRoot = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Adobe', 'Adobe After Effects 2026', 'Support Files');
var documents = path.join(process.env.USERPROFILE, 'Documents');
if (!fs.existsSync(installRoot) || !fs.existsSync(documents)) {
  console.log('SKIP: local After Effects inventory folders are not present on this computer.');
  process.exit(0);
}
Folder.appPackage = new DiskFolder(installRoot);
Folder.myDocuments = new DiskFolder(documents);
var context = { app: { version: '26.3' }, Folder: Folder, File: File };
vm.runInNewContext(hostSource, context);

var roots = JSON.parse(context.getLocalDiscoveryRoots());
assert.strictEqual(roots.ok, true);
var presetCount = 0;
var pluginCount = 0;
roots.presetRoots.forEach(function (root) {
  var result = JSON.parse(context.scanLocalPresetFolder(root.path, root.source));
  assert.strictEqual(result.ok, true, root.path);
  presetCount += result.count;
});
roots.pluginRoots.forEach(function (root) {
  var result = JSON.parse(context.scanLocalPluginFolder(root.path, root.source));
  assert.strictEqual(result.ok, true, root.path);
  pluginCount += result.count;
});

assert.ok(presetCount > 0);
assert.ok(pluginCount > 0);
console.log('PASS: actual local folders scanned through a simulated ExtendScript filesystem adapter (' +
  presetCount + ' .ffx files, ' + pluginCount + ' .aex files). This is not an After Effects runtime test.');
