const Utils = require('../helpers/utils');
const fs = require('fs');
const path = require('path');

/**
 * @type {{hasherAlgorithm: string, regexImports: RegExp}}
 */
let JsImportResolverProperties = {
  regexImports: /^\s*?\bimport\b.*?(?:from)?[\s\S]+?['"](.*?)['"]|\brequire\b[\s]*\([\s]*['"](.+?)['"][\s]*\)|(module.exports[\s]*?=[\s\S]+?require[\s\S]*?\(.*?\))/gmi,
  hasherAlgorithm: 'sha1',
};

/**
 * @param {JsImportResolverProperties?} props
 * @constructor
 */
let JsImportResolver = function (props) {
  this.props = Utils.extend(JsImportResolverProperties, props);
};
module.exports = JsImportResolver;


/** @param {JsImportResolverProperties?} props */
JsImportResolver.make = function (props) {
  return new JsImportResolver(props || {});
};

JsImportResolver.prototype = function () {
  let resolver;
  let fileFound = [];

  let container = {};
  let resolvedFileStack=[];
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
        insertDependenciesToContainer(curFile);
      }
    }
  }

  function resolveOrder(resolvedEntryFile) {
    let ordered = [];
    resolvedFileStack.push(resolvedEntryFile);
    while(resolvedFileStack.length!==0) {
      let curFile = resolvedFileStack.pop();
      ordered.unshift(curFile);
      curFile.vout.forEach((dependency) => {
        dependency.in--;
        if(dependency.in === 0)
          resolvedFileStack.push(dependency);
      })
    }
    return ordered;
  }

  function insertDependenciesToContainer(resolvedParent) {
    let dependencies = findImports(resolvedParent);
    dependencies.forEach((dependency)=> {
      try {
          let resolvedDependency = insertFileToContainer(dependency, resolvedParent.dir);
          resolvedFileStack.push(resolvedDependency);
          resolvedParent.vout.push(resolvedDependency);
          resolvedDependency.vin.push(resolvedParent);
          resolvedDependency.in++;
      } catch (e) {
        raiseError(__filename, resolvedParent.file, dependency);
      }
    });
  }


  /**
   *Parfois l'INODE des fichiers peut être les mêmes à cause de la conversion intrinsèque à javascript
   * des nombres en "double". Par conséquent un fichier est identifié de manière unique à l'aide
   * de son INODE et du nom de fichier.
   * Node occasionally gives multiple files/folders the same inode: https://github.com/nodejs/node/issues/12115
   */
  function insertFileToContainer(file, baseDir) {
    let resolvedFile = Utils.resolveFile(file, baseDir);
    let filestats = fs.statSync(resolvedFile);
    let fileParts = path.parse(resolvedFile);
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
        vout: [],
        vin: [],
        in: 0
      };
    return container[ino];
  }

  function findImports(resolvedParent) {
    let contents = fs.readFileSync(resolvedParent.file, 'utf8');
    let imports = [];
    let m;
    while ((m = resolver.props.regexImports.exec(contents)) !== null) {
      if (m.index === resolver.props.regexImports.lastIndex)
        resolver.props.regexImports.lastIndex++;
      let dependencyFile = m[1]||m[2];
      if(!m[3] && dependencyFile)
        imports.push(dependencyFile);
    }
    return imports;
  }

  function getFileImports(filePath) {
    let fileListOfImports = [];
    let importCounter = 0;
    filePath = fs.realpathSync(filePath);
    let contents = fs.readFileSync(filePath, 'utf8');
    let pathBase = filePath.substring(0, filePath.lastIndexOf('\\') + 1);
    let m;
    //let startTime = process.hrtime();
    while ((m = resolver.props.regexImports.exec(contents)) !== null) {
      if (m.index === resolver.props.regexImports.lastIndex) {
        resolver.props.regexImports.lastIndex++;
      }
      let matchedFile = m[1]||m[2];
      try {
        if (!m[3] && matchedFile) {
          matchedFile = Utils.resolveFile(matchedFile, pathBase);
          let parts = path.parse(matchedFile);
          let matchedFileStat = fs.statSync(matchedFile);
          importCounter++;
          fileListOfImports[matchedFileStat.ino+'.'+parts.name] = {
            file: matchedFile,
            ino: matchedFileStat.ino+'.'+parts.name,
            mtime: matchedFileStat.mtime
          };
        }
      } catch (e) {
        raiseError(__filename, filePath, matchedFile);
      }
    }
    let fileStat = fs.statSync(filePath);
    //let time = process.hrtime(startTime);
    //sumDelay+=(time[0] * 1e9 + time[1]) / 1e9;
    //console.log(fileStat.ino+' | time:', (time[0] * 1e9 + time[1]) / 1e9, 'filename: '+filePath);
    //console.log(fileStat.ino, 'nImports: '+importCounter, 'filename: '+filePath);
    let filePart = Utils.breakFullPathFile(filePath);
    return {
      file: filePath,
      ino: fileStat.ino+'.'+filePart.fileName,
      mtime: fileStat.mtime,
      imports: fileListOfImports,
      importCount: importCounter,
      fileName: filePart.fileName,
      extension: filePart.extension,
      dir: filePart.path
    };
  }


  function raiseError(filename, filePath, matchedFile) {
    console.error('\nError raised by ' + filename);
    console.error('Error found in ' + filePath);
    console.error("File not found: " + matchedFile);
    process.exit();
  }

  return {
    getListOfImports(file) {
      fileFound = [];
      resolver = this;
      return resolveDependencyTree(file);
    },

    getFileImports(file) {
      resolver = this;
      return getFileImports(file);
    }
  }
}();
