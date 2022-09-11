const fs = require('fs');
const eventbus = require('../../helpers/eventbus');
const LinkusEvent = require('../../core/linkus-event');

const jsImportResolver = require('./js-import-resolver');
const jsTokenizer = require("./jsTokenizer");
const {jsImportAnalyser,jsImportType} = require("./jsImportAnalyser");

const FileMapping = require('../../core/FileMapping');

eventbus.on(LinkusEvent.onResolve, onResolve);
function onResolve(linkus) {

  if (linkus.context.entry.extension === '.js') {
    process.stdout.write('linking \x1b[35m' + linkus.context.entry.fileName + linkus.context.entry.extension + '\x1b[0m');
    let state;
    if (!linkus.props.nocache)
      state = checkFileStateWithCache(linkus);

    switch (state) {
      case 'nochange':
        linkus.context.state = 'NO_CHANGE';
        break;
      case 'changed':
      default:
        runDependencyResolver(linkus);
    }
  }
}

function runDependencyResolver(linkus) {
  //let start = process.hrtime();
  let dependencies = jsImportResolver.getListOfImports(linkus.context.entry.file);
  //let end = process.hrtime(start);
  process.stdout.write('\x1b[32m ('+dependencies.length+' dépendencies)\x1b[0m');
  //process.stdout.write(',' + ((end[0] * 1e9 + end[1]) / 1e9) + ' seconds)')
  let fileMapping = new FileMapping(linkus);
  let mappedFiles = fileMapping.applyMapping(dependencies);
  mappedFiles.forEach((fileInfo) => {
    fileInfo.tokens = jsTokenizer( fs.readFileSync(fileInfo.file, 'utf8'));
    fileInfo.analyse = jsImportAnalyser( fileInfo.tokens );
  });
  linkus.context.dependencyOrder = dependencies;
}

function checkFileStateWithCache(linkus) {
  let cachedDependencies = linkus.cached.getDependencies();
  let N = cachedDependencies.length;
  if (N === 0 || !linkus.cached.isOutputFileExist()) return 'nobuild';
  linkus.context.dependencyOrder = cachedDependencies;
  for (let i = 0; i < N; i++) {
    let fileInfo = cachedDependencies[i];
    if (!fs.existsSync(fileInfo.file)) {
      return 'changed';
    } else {
      let stat = fs.statSync(fileInfo.file);
      if (stat.mtime.toISOString() !== fileInfo.mtime) {
        return 'changed';
      }
    }
  }
  process.stdout.write(' ->\x1b[32m no change detected\x1b[0m');
  return 'nochange';
}

// ------------------------------------------------

require('./js-on-make-output');


