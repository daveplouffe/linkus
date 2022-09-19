const Utils = require('../../helpers/utils');
const fs = require('fs');
const path = require('path');
const jsTokenizer = require("./jsTokenizer");
const {jsImportAnalyser,jsImportType} = require("./jsImportAnalyser");
const resolve = require('resolve/sync'); // npm install resolve --save-dev

let includeContainer = {};
let container = {};
let resolvedFileStack=[];
let lastNodeModule = null;

module.exports = {getListOfImports,getFileImports};

function getListOfImports(file) {
  let result = resolveDependencyTree(file);
  return result;
}
function getFileImports(fileInfo) {
  let analyse = jsImportAnalyser( jsTokenizer( fs.readFileSync(fileInfo.file, 'utf8') ) );
  let imports = {
    analyse,
    vin: [],
    vout: [],
    include: []
  }
  let resolvedDependency;
  analyse.tokenOrder.forEach(dependency => {
    if([jsImportType.imports, jsImportType.requires].indexOf(dependency.type) !== -1) {
      try {
        resolvedDependency = insertFileToContainer(dependency.file, fileInfo.dir);
        imports.vin.push(resolvedDependency);
        resolvedDependency.vout.push(fileInfo);
      } catch (e) {
        raiseError(fileInfo.file, dependency);
      }
    } else if(dependency.type === jsImportType.includes) {
      try {
        imports.include.push(insertIncludeToContainer(dependency.file, fileInfo.dir));
      } catch (e) {
        raiseError(fileInfo.file, dependency);
      }
    }
  });
  return imports;
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
    if(!curFile.analyse) {
      resolveDependency(curFile);
    }
  }
}
function resolveDependency(fileInfo) {
  let tokens = jsTokenizer( fs.readFileSync(fileInfo.file, 'utf8'));
  let analyser = jsImportAnalyser( tokens );
  fileInfo.analyse = analyser;
  fileInfo.tokens = tokens;
  let importOrder = analyser.tokenOrder;
  let resolvedfiles = resolveFilePaths(importOrder, fileInfo.dir);
  let stats = getFileStats(resolvedfiles);
  let resolvedDependency;
  let token;
  for(let i=0, imax=importOrder.length; i<imax; i++) {
    token = importOrder[i];
    if([jsImportType.imports, jsImportType.requires].indexOf(token.type) !== -1) {
        resolvedDependency = getDependencyObject(resolvedfiles[i], stats[i]);
        resolvedFileStack.push(resolvedDependency);
        fileInfo.vin.push(resolvedDependency);
        resolvedDependency.vout.push(fileInfo);
        resolvedDependency.in++;
    } else if(token.type === jsImportType.includes) {
        fileInfo.include.push(getIncludeObject(resolvedfiles[i], stats[i]));
    }
  }

}

function resolveFilePaths(tokens, basedir) {
  let resolvedFilePaths = [];
  let i,imax = tokens.length;
  try {
    for(i=0; i<imax; i++) {
      if(tokens[i].type<4) {
        if(['.','/'].indexOf( tokens[i].file[0]) === -1) {
          if(lastNodeModule) {
            try{
              resolvedFilePaths[i] = path.normalize(lastNodeModule +'\\' + tokens[i].file);
              if(path.extname(resolvedFilePaths[i]) === '') resolvedFilePaths[i] += '.js';
            } catch (e) {
              lastNodeModule = null;
              resolvedFilePaths[i] = resolve(tokens[i].file, {basedir: basedir});
            }
          } else {
            // la fonction resolve(...) est très lente puisqu'elle vérifie l'ensemble des emplacements
            // possibles du dossier node_modules. C'est pourquoi on garde en mémoire l'emplacement du node_modules.
            resolvedFilePaths[i] = resolve(tokens[i].file, {basedir: basedir});
            lastNodeModule = path.normalize(resolvedFilePaths[i]);
            lastNodeModule = lastNodeModule.substr(0, lastNodeModule.indexOf(path.normalize(tokens[i].file)));
          }
        } else {
          resolvedFilePaths[i] = path.normalize(basedir +'\\' + tokens[i].file);
          if(path.extname(resolvedFilePaths[i]) === '') resolvedFilePaths[i] += '.js';
        }
      }
      else
        resolvedFilePaths[i] = 0;
    }
  } catch (e) {
    raiseError(basedir, tokens[i]);
  }

  return resolvedFilePaths;
}
function getFileStats(files) {
  let fileStats = [];
  for(let i=0, imax=files.length; i<imax; i++) {
    if(files[i]) {
      fileStats[i] = fs.statSync(files[i]);
    }
  }
  return fileStats;
}

function resolveOrder(resolvedEntryFile) {
  // Topological sorting, kahn's Algorithm
  let reverseOrder = [];
  resolvedFileStack.push(resolvedEntryFile);
  while(resolvedFileStack.length!==0) {
    let curFile = resolvedFileStack.pop();
    reverseOrder.push(curFile);
    curFile.vin.forEach((dependency) => {
      dependency.in--;
      if(dependency.in === 0)
        resolvedFileStack.push(dependency);
    })
  }

  let ordered = [];
  let i = reverseOrder.length;
  while(i-- >0) {
    delete reverseOrder[i].in;
    ordered.push(reverseOrder[i]);
  }

  return ordered;
}

function getDependencyObject(absolutePathFile, stats) {
  /**
   *Parfois l'INODE des fichiers peut être les mêmes à cause de la conversion intrinsèque à javascript
   * des nombres en "double". Par conséquent un fichier est identifié de manière unique à l'aide
   * de son INODE et du nom de fichier.
   * Node occasionally gives multiple files/folders the same inode: https://github.com/nodejs/node/issues/12115
   */
  let fileParts = path.parse(absolutePathFile);
  let ino = stats.ino + '.'+ fileParts.name;
  if(!container[ino])
    container[ino] = {
      fileName: fileParts.name,
      file: absolutePathFile,
      fncName: '__linkus_' + fileParts.name.replace(/[-. ]/g,'_'),//+ '_'+stats.ino,
      extension: fileParts.ext,
      dir: fileParts.dir,
      mtime: stats.mtime,
      ino: ino,
      analyse: null,
      vin: [],
      vout: [],
      include: [],
      tokens: null,
      in: 0
    };
  return container[ino];
}
function getIncludeObject(absolutePathFile, stats) {
  let fileParts = path.parse(absolutePathFile);
  let ino = stats.ino + '.'+ fileParts.name;
  if(!includeContainer[ino])
    includeContainer[ino] = {
      fileName: fileParts.name,
      file: absolutePathFile,
      extension: fileParts.ext,
      dir: fileParts.dir,
      mtime: stats.mtime,
      ino: ino
    };
  return includeContainer[ino];
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
      tokens: null,
      analyse: null,
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
