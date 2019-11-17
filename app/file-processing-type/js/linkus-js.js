const fs = require('fs');
const eventbus = require('../../helpers/eventbus');
const LinkusEvent = require('../../core/linkus-event');
const ClosureCompiler = require('../../helpers/closure-compiler');
const Utils = require('../../helpers/utils');

const jsImportResolver = require('../../core/js-import-resolver').make();
const dependency = require('../../core/dependency');
const FileMapping = require('../../core/FileMapping');
const OutputMaker = require('../../core/output-maker');

/*
 {
compile: args.compile,
isDebug: args.compileDebug,
compilationLevel: args.compilationLevel}
)
 */
eventbus.on(LinkusEvent.onCompile, function (linkus) {
  if (linkus.context.entry.extension === '.js' && linkus.props.compile.enabled) {
    let file = Utils.breakFullPathFile(linkus.context.output);
    let outputFile = file.path + file.fileName + '.min' + file.extension;
    ClosureCompiler.compile({
      process_common_js_modules: linkus.props.compile.process_common_js_modules,
      module_resolution: linkus.props.compile.module_resolution,
      formatting: '',
      js: linkus.context.output,
      compilation_level: linkus.props.compile.compilationLevel,
      js_output_file: outputFile,
      create_source_map: outputFile + '.map',
      debug: linkus.props.compile.isDebugMode
    });
  }
});


// -------------------------------------------------


eventbus.on(LinkusEvent.onResolve, function (linkus) {
  if (linkus.context.entry.extension === '.js') {
    let state = isFileHasChanged(linkus);
    switch (state.status) {
      case 'minor change':
        saveCodeChanged(linkus, state);
      case 'nochange':
        linkus.context.state = 'NO_CHANGE';
        break;
      case 'major change':
      default:
        runDependencyResolver(linkus);
    }
  }
});

function runDependencyResolver(linkus) {
  let dependencies = getOrderedDependencies(linkus);
  let fileMapping = new FileMapping(linkus);
  fileMapping.applyMapping(dependencies);
  linkus.context.dependencyOrder = dependencies;
}

function getOrderedDependencies(linkus) {
  let imports = jsImportResolver.getListOfImports(linkus.context.entry.file);
  return dependency.resolveOrdered(imports);
}

function isFileHasChanged(linkus) {
  let cachedDependencies = linkus.cached.getDependencies();
  let N = cachedDependencies.length;
  if (N === 0 || !linkus.cached.isOutputfileExist()) return 'nobuild';
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
  let status;
  if (notFound.length > 0 || importChanged.length > 0)
    status = 'major change';
  else if (codeChanged.length > 0) {
    console.log('code change detected...');
    status = 'minor change';
  } else {
    console.log('no change detected...');
    status = 'nochange';
  }

  return {
    status,
    codeChanged,
    notFound,
    importChanged
  };
}

function isImportHasChanged(fileinfo) {
  let fileImports = jsImportResolver.getFileImports(fileinfo.file);
  return !dependency.hasSameDependencies(
    dependency.arrayImportToInoKey(fileinfo.imports), fileImports.imports);
}

function saveCodeChanged(linkus, changed) {
  let outputMaker = OutputMaker.create();
  changed.codeChanged.forEach(function (fileInfo) {
    console.log('updating ' + fileInfo.fileName + fileInfo.extension);
    let oldBytes = fileInfo.bytes;
    let content = outputMaker.formatFileContent(linkus, fileInfo);
    linkus.cached.saveFile(fileInfo.ino, content);
    let stats = fs.statSync(fileInfo.file);
    fileInfo.mtime = stats.mtime;
    hotSwap(linkus, fileInfo, content, oldBytes);
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

eventbus.on(LinkusEvent.onMakeOutput, function (linkus) {
  if (linkus.context.entry.extension === '.js' && linkus.context.state !== 'NO_CHANGE') {
    let outputMaker = OutputMaker.create();
    outputMaker.makeOutput({
      linkus,
      dependencyOrder: linkus.context.dependencyOrder,
      output: linkus.context.output
    });
    linkus.cached.saveDependencies(linkus.context.dependencyOrder);
  }
});
