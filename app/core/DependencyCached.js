const fs = require('fs');
const Utils = require('../helpers/utils');

let DependencyCached = function (linkus) {

  let cachedir = linkus.context.outputParts.path + '/linkus_cached/';
  let dependencyCachedFile = linkus.context.outputParts.fileName + '_cached.json';
  Utils.createFolders(cachedir);
  let loaded = [];

  loadCache();

  function loadCache() {
    try {
      loaded = JSON.parse(Utils.getFileContent(cachedir + dependencyCachedFile));
    } catch (e) {
      loaded = {
        output: null,
        dependencies: []
      }
    }
  }

  function getDependencies() {
    return loaded.dependencies;
  }

  function getOutput() {
    return loaded.output;
  }

  function isOutputfileExist() {
    return fs.existsSync(loaded.output);
  }

  function saveDependencies(dependencies) {
    saveFile(dependencyCachedFile, JSON.stringify({
      output: linkus.context.output,
      dependencies
    }));
  }

  function updateDependencies() {
    saveDependencies(loaded.dependencies)
  }

  function saveFile(file, content) {
    fs.writeFileSync(cachedir + file, content, 'utf8');
  }

  function loadFile(file) {
    return fs.readFileSync(cachedir + file, 'utf8');
  }

  return {
    saveDependencies,
    updateDependencies,
    getDependencies,
    saveFile,
    loadFile,
    getOutput,
    isOutputfileExist
  }
};

module.exports = DependencyCached;