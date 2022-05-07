const Utils = require('../helpers/utils');
const fs = require('fs');
const path = require('path');
const jsTokenizer = require("../core/jsTokenizer");
const {jsImportAnalyser,jsImportType} = require("../core/jsImportAnalyser");

/**
 * @type {{hasherAlgorithm: string, regexImports: RegExp}}
 */
let JsImportResolverProperties = {
  regexImports: /^ *?\bimport\b.*?(?:from)?[\s\S]+?['"](.*?)['"]|^ *(?:let|var|const) .*= *\brequire\b *\( *['"](.+?)['"] *\);?|\blinkus_include\b *\( *['"](.*)['"]\)/gmi,
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
  let includeContainer = {};
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
        resolveDependency(curFile);
      }
    }
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

  /**@deprecated */
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

  function raiseError(file, match) {
    console.log('\nError raised by ' + __filename);
    console.log('\x1b[31mFile not found: ' + match.file, '\x1b[0m');
    console.log('\tat\x1b[34m','('+ file + ':'+match.lineNumber+':'+(match.column)+')', '\x1b[0m');
    process.exit();
  }

  return {
    getListOfImports(file) {
      resolver = this;
      return resolveDependencyTree(file);
    },

    getFileImports(file) {
      resolver = this;
      return getFileImports(file);
    }
  }
}();
