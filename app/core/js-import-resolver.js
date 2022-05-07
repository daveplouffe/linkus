const Utils = require('../helpers/utils');
const fs = require('fs');
const path = require('path');
const jsTokenizer = require("../core/jsTokenizer");
const {jsImportAnalyser,jsImportType} = require("../core/jsImportAnalyser");

let includeContainer = {};
let container = {};
let resolvedFileStack=[];

module.exports = {getListOfImports};

function getListOfImports(file) {
  return resolveDependencyTree(file);
}

function resolveDependencyTree(entryFile, projectDir) {
  let entry = insertFileToContainer(entryFile, projectDir);
  resolveDependencies(entry);
  return resolveOrder(entry);
}

function resolveDependencies(resolvedEntryFile) {
  resolvedFileStack.push(resolvedEntryFile);
  while(resolvedFileStack.length!==0) {
    let curFile = resolvedFileStack.pop();
    if(!curFile.analysed) {
      curFile.analysed = true;
      resolveDependency(curFile);
    }
  }
}
function resolveDependency(fileInfo) {
  let dependencies = jsImportAnalyser( jsTokenizer( fs.readFileSync(fileInfo.file, 'utf8') ) );
  fileInfo.analyse = dependencies;
  let resolvedDependency;
  dependencies.tokenOrder.forEach(dependency => {
    if([jsImportType.imports, jsImportType.requires].indexOf(dependency.type) !== -1) {
      try {
        resolvedDependency = insertFileToContainer(dependency.file, fileInfo.dir);
        resolvedFileStack.push(resolvedDependency);
        fileInfo.vin.push(resolvedDependency);
        resolvedDependency.vout.push(fileInfo);
        resolvedDependency.in++;
      } catch (e) {
        raiseError(fileInfo.file, dependency);
      }
    } else if(dependency.type === jsImportType.includes) {
      try {
        fileInfo.include.push(insertIncludeToContainer(dependency.file, fileInfo.dir));
      } catch (e) {
        raiseError(fileInfo.file, dependency);
      }
    }
  });
}
function resolveOrder(resolvedEntryFile) {
  let ordered = [];
  resolvedFileStack.push(resolvedEntryFile);
  while(resolvedFileStack.length!==0) {
    let curFile = resolvedFileStack.pop();
    ordered.unshift(curFile);
    curFile.vin.forEach((dependency) => {
      dependency.in--;
      if(dependency.in === 0)
        resolvedFileStack.push(dependency);
    })
  }

  // clean up properties
  ordered.forEach(o=>{
    delete o.in;
    delete o.analysed;
  });
  return ordered;
}

function insertFileToContainer(file, baseDir) {
  let resolvedFile = Utils.resolveFile(file, baseDir);
  let filestats = fs.statSync(resolvedFile);
  let fileParts = path.parse(resolvedFile);

  /**
   *Parfois l'INODE des fichiers peut être les mêmes à cause de la conversion intrinsèque à javascript
   * des nombres en "double". Par conséquent un fichier est identifié de manière unique à l'aide
   * de son INODE et du nom de fichier.
   * Node occasionally gives multiple files/folders the same inode: https://github.com/nodejs/node/issues/12115
   */
  let ino = filestats.ino + '.'+ fileParts.name;
  if(!container[ino])
    container[ino] = {
      fileName: fileParts.name,
      file: resolvedFile,
      extension: fileParts.ext,
      dir: fileParts.dir,
      mtime: filestats.mtime,
      ino: ino,
      analysed: false,
      vin: [],
      vout: [],
      include: [],
      in: 0
    };
  return container[ino];
}
function insertIncludeToContainer(file, basedir) {
  let resolvedFile = Utils.resolveFile(file, basedir);
  let filestats = fs.statSync(resolvedFile);
  let fileParts = path.parse(resolvedFile);
  let ino = filestats.ino + '.'+ fileParts.name;
  if(!includeContainer[ino])
    includeContainer[ino] = {
      fileName: fileParts.name,
      file: resolvedFile,
      extension: fileParts.ext,
      dir: fileParts.dir,
      mtime: filestats.mtime,
      ino: ino
    };
  return includeContainer[ino];
}

function raiseError(file, match) {
  console.log('\nError raised by ' + __filename);
  console.log('\x1b[31mFile not found: ' + match.file, '\x1b[0m');
  console.log('\tat\x1b[34m','('+ file + ':'+match.lineNumber+':'+(match.column)+')', '\x1b[0m');
  process.exit();
}
