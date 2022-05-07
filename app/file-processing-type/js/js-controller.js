const fs = require('fs');
const eventbus = require('../../helpers/eventbus');
const LinkusEvent = require('../../core/linkus-event');

const jsImportResolver = require('../../core/js-import-resolver').make();
const dependency = require('../../core/dependency');
const FileMapping = require('../../core/FileMapping');
const OutputMaker = require('../../core/output-maker');

eventbus.on(LinkusEvent.onResolve, onResolve);
function onResolve(linkus) {

  if (linkus.context.entry.extension === '.js') {
    process.stdout.write('linking \x1b[35m' + linkus.context.entry.fileName + linkus.context.entry.extension + '\x1b[0m');
    let state = {};
    if (!linkus.props.nocache)
      state = checkFileStateWithCache(linkus);

    switch (state.status) {
      case 'minor change':
        saveCodeChanged(linkus, state);
      case 'nochange':
        linkus.context.state = 'NO_CHANGE';
        break;
      case 'major change':
      default:
        process.stdout.write('\n');
        runDependencyResolver(linkus);
    }
  }
}

function runDependencyResolver(linkus) {
  let dependencies = jsImportResolver.getListOfImports(linkus.context.entry.file);
  let fileMapping = new FileMapping(linkus);
  fileMapping.applyMapping(dependencies);
  linkus.context.dependencyOrder = dependencies;
}

function checkFileStateWithCache(linkus) {
  let cachedDependencies = linkus.cached.getDependencies();
  let N = cachedDependencies.length;
  if (N === 0 || !linkus.cached.isOutputFileExist()) return 'nobuild';
  let codeChanged = [];
  let notFound = [];
  let importChanged = [];
  for (let i = 0; i < N; i++) {
    let fileInfo = cachedDependencies[i];
    if (!fs.existsSync(fileInfo.file)) {
      notFound.push(fileInfo);
    } else {
      let stat = fs.statSync(fileInfo.file);
      if (stat.mtime.toISOString() !== fileInfo.mtime) {
        if (isImportHasChanged(fileInfo))
          importChanged.push(fileInfo);
        else
          codeChanged.push(fileInfo);
      }
    }
  }
  let status = getBuildStatus(notFound.length, importChanged.length, codeChanged.length);
  return {
    status,
    codeChanged,
    notFound,
    importChanged
  };
}

function getBuildStatus(nbNotFound, nbImportChanged, nbCodeChanged) {
  let status;
  if (nbNotFound > 0 || nbImportChanged > 0) {
    status = 'major change';
  }
  else if (nbCodeChanged > 0) {
    process.stdout.write(' ->\x1b[33m code change detected\x1b[0m\n');
    status = 'minor change';
  }
  else {
    process.stdout.write(' ->\x1b[32m no change detected\x1b[0m\n');
    status = 'nochange';
  }
  return status;
}

function isImportHasChanged(fileinfo) {
  let fileImports = jsImportResolver.getFileImports(fileinfo.file);
  return !dependency.hasSameDependencies(
    dependency.arrayImportToInoKey(fileinfo.imports), fileImports.imports);
}

function saveCodeChanged(linkus, changed) {
  let outputMaker = OutputMaker.create();
  changed.codeChanged.forEach(function (fileInfo) {
    process.stdout.write('  ...updating \x1b[32m' + fileInfo.fileName + fileInfo.extension + '\x1b[0m\n');
    fileInfo.mtime = fs.statSync(fileInfo.file).mtime;
  });
  outputMaker.makeOutput({
    linkus,
    dependencyOrder: linkus.cached.getDependencies(),
    output: linkus.context.output
  });
  linkus.cached.updateDependencies();
}

let cachedOutputContent;

function hotSwap(linkus, fileInfo, fileContent, oldBytes) {
  if (!cachedOutputContent)
    cachedOutputContent = fs.readFileSync(linkus.cached.getOutput(), 'utf8');

  let index = cachedOutputContent.search(new RegExp('\n\n//------------------------------------------------\n// #' + fileInfo.count + ' \n// ino: ' + fileInfo.ino));
  if (index !== -1) {
    cachedOutputContent = cachedOutputContent.substr(0, index)
      + fileContent
      + cachedOutputContent.substr(index + oldBytes);
    fs.writeFileSync(linkus.context.output, cachedOutputContent, 'utf8');
  }
}

// ------------------------------------------------

require('./js-on-make-output');
require('./js-on-compile');


