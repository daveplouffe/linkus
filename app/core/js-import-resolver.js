const Utils = require('../helpers/utils');
const fs = require('fs');

/**
 * @type {{hasherAlgorithm: string, regexImports: RegExp}}
 */
let JsImportResolverProperties = {
  regexImports: /\bimport\b.*?(?:from)?[\s\S]+?['"]([^'"]*?)['"]/gm,
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
  let counterImports = 0;
  let maxRecursive = 0;
  let recursiveCounter = 0;

  let notAnalysedFileCounter;
  let fileAnalysed;
  let notAnalysedFiles;

  function getImportsNonRecursive(file) {
    notAnalysedFileCounter = 0;
    notAnalysedFiles = [];
    fileAnalysed = [];
    let fileAnalyse = getFileImports2(file);
    fileAnalysed[fileAnalyse.ino] = fileAnalyse;
    mergeNotAnalysed(fileAnalyse.imports);
    counterImports++;
    while (notAnalysedFileCounter !== 0) {
      let nextFileToAnalyse = Object.keys(notAnalysedFiles)[0];
      fileAnalyse = getFileImports2(notAnalysedFiles[nextFileToAnalyse].file);
      notAnalysedFileCounter--;
      counterImports++;
      delete notAnalysedFiles[nextFileToAnalyse];
      fileAnalysed[fileAnalyse.ino] = fileAnalyse;
      mergeNotAnalysed(fileAnalyse.imports);
    }
    return fileAnalysed;
  }

  function mergeNotAnalysed(list) {
    for (let m in list) {
      if (!notAnalysedFiles[m] && !fileAnalysed[m]) {
        notAnalysedFiles[m] = list[m];
        notAnalysedFileCounter++;
      }
    }
  }

  function getListOfImportsRecursive(aFile, listOfImports) {
    recursiveCounter++;
    if (recursiveCounter > maxRecursive) maxRecursive = recursiveCounter;
    let importResult = getFileImports(aFile);
    listOfImports = importResult;
    let curfileImports = importResult.imports;
    let N = curfileImports.length;
    for (let i = 0; i < N; i++) {
      let index = fileFound.indexOf(curfileImports[i].ino);
      counterImports++;
      if (index === -1) {
        fileFound.push(curfileImports[i].ino);
        curfileImports[i] = getListOfImportsRecursive(curfileImports[i].file, curfileImports[i]);
      }
    }
    recursiveCounter--;
    return listOfImports;
  }

  function getFileImports2(filePath) {
    let fileListOfImports = [];
    let importCounter = 0;
    filePath = fs.realpathSync(filePath);
    let contents = fs.readFileSync(filePath, 'utf8');
    let pathBase = filePath.substring(0, filePath.lastIndexOf('\\') + 1);
    let m;
    //let startTime = process.hrtime();
    while ((m = resolver.props.regexImports.exec(contents)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === resolver.props.regexImports.lastIndex) {
        resolver.props.regexImports.lastIndex++;
      }
      let matchedFile = m[1];
      try {
        if (matchedFile) {
          matchedFile = Utils.resolveFile(m[1], pathBase);
          let matchedFileStat = fs.statSync(matchedFile);
          importCounter++;
          fileListOfImports[matchedFileStat.ino] = {
            file: matchedFile,
            ino: matchedFileStat.ino,
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
      ino: fileStat.ino,
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
      //let imports = getListOfImportsRecursive(file, {});
      //console.log('total time: '+sumDelay, '| nb imports: '+counterImports, '| nRecursive: '+maxRecursive);
      return getImportsNonRecursive(file);
    },

    getFileImports(file) {
      resolver = this;
      return getFileImports2(file);
    }
  }
}();
