const fs = require('fs');
const Utils = require('../helpers/utils');
const path = require('path');

let DependencyCached = function (linkus) {

  let cachedir = linkus.context.outputParts.path + '/linkus_cache/';
  let dependencyCachedFile = linkus.context.outputParts.fileName + '_cache.json';
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

  function isOutputFileExist() {
    return fs.existsSync(loaded.output);
  }

  function getCompiledOutputFileName() {
    let parsedPath = path.parse(loaded.output);
    return parsedPath.dir + '/' + parsedPath.name + '.min' + parsedPath.ext;
  }

  function isOutputCompilationExist() {
    return fs.existsSync(getCompiledOutputFileName());
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
    isOutputFileExist,
    isOutputCompilationExist,
    getCompiledOutputFileName
  }
};

module.exports = DependencyCached;