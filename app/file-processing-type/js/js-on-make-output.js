const eventbus = require('../../helpers/eventbus');
const OutputMaker = require('../../core/output-maker');
const LinkusEvent = require('../../core/linkus-event');
const resolve = require('resolve');
const fs = require('fs');

eventbus.on(LinkusEvent.onMakeOutput, onMakeOutput);

function onMakeOutput(linkus) {
  if (linkus.context.entry.extension === '.js' && linkus.context.state !== 'NO_CHANGE') {

    makeOutputOnly(linkus);

    //let outputMaker = OutputMaker.create();
    //outputMaker.makeOutput({
    //  linkus,
    //  dependencyOrder: linkus.context.dependencyOrder,
    //  output: linkus.context.output
    //});
    linkus.cached.saveDependencies(linkus.context.dependencyOrder);
  }
}

let curFileContent;
let modifiedContent;
let curFileInfo;
let processToken = [0,
  processIncludeToken,
  processImportToken,
  processRequireToken,
  processExportToken,
  processExportToken
];
let cursor;
let vinOffset;
let exportList;
let isDefaultExport;
let nbOfFiles;
let isModular = false;

function makeOutputOnly(linkus) {
  let dependencyOrder = linkus.context.dependencyOrder;
  let content, buffer = '';
  isModular = linkus.props.modularImport;
  nbOfFiles = dependencyOrder.length-1;
  for (let i = 0; i <= nbOfFiles; i++) {
    curFileInfo = dependencyOrder[i];
    curFileInfo.count = i;
    content = readContent(linkus, curFileInfo);
    linkus.context.curFile = {info: curFileInfo, content};
    eventbus.emit(LinkusEvent.onBeforeWriteContentToOutput, linkus);
    buffer += content;
  }
  fs.writeFileSync(linkus.context.output, buffer, 'utf8');
}

function processIncludeToken(token) {
  modifiedContent += curFileContent.substring(cursor, token.index);
  modifiedContent += readInclude(curFileInfo, token);
  cursor = token.index + token.length;
}
function processImportToken(token, vinOffset) {
  modifiedContent += curFileContent.substring(cursor, token.index);
  //modifiedContent += '/*' + curFileContent.substr(token.index, token.length) + '*/';
  cursor = token.index + token.length;
  if(!isModular) return;
  let fncName = curFileInfo.vin[vinOffset].fncName + '();';
  if(token.variables.length) {
    if (token.hasDefault === false || token.variables.length > 1 || curFileInfo.vin[vinOffset].analyse.tokenOut.length > 1) {
      modifiedContent += 'const {' + token.variables.join(',') + '} = ' + fncName;
    } else {
      modifiedContent += 'const ' + token.variables.join(',') + ' = ' + fncName;
    }
  }
}
function processRequireToken(token, vinOffset) {
  if(isModular) {
    modifiedContent += curFileContent.substring(cursor, token.requireIndex);
    //modifiedContent += '/*' + curFileContent.substr(token.requireIndex, token.requireLength) + '*/';
    cursor = token.requireIndex + token.requireLength;
    modifiedContent += curFileInfo.vin[vinOffset].fncName + '()';
  } else {
    modifiedContent += curFileContent.substring(cursor, token.index);
    //modifiedContent += '/*' + curFileContent.substr(token.index, token.length) + '*/';
    cursor = token.index + token.length;
  }

}
function processExportToken(token) {
  modifiedContent += curFileContent.substring(cursor, token.index);
  //modifiedContent += '/*' + curFileContent.substr(token.index, token.length) + '*/';
  cursor = token.index + token.length;
  exportList = exportList.concat(token.variables);
  if (token.type === 4) isDefaultExport = false;
  vinOffset--;
}
function processExports() {
  if(!isModular) return;
  if (exportList.length) {
    if (isDefaultExport)
      modifiedContent += '\nreturn ' + exportList[0] + ';';
    else
      modifiedContent += '\nreturn {' + exportList.join(',') + '};';
  }
}

function readContent(linkus, fileInfo) {
  curFileContent = fs.readFileSync(fileInfo.file, 'utf8');
  modifiedContent = '';
  exportList = [];
  cursor = 0;
  vinOffset = 0;
  isDefaultExport = true;

  fileInfo.analyse.tokenOrder.forEach((token, i) => {
    processToken[token.type](token, i+vinOffset);
  });
  modifiedContent += curFileContent.substring(cursor, curFileContent.length);
  processExports();

  if(isModular && exportList.length>0) {
    let fncName = 'function ' + fileInfo.fncName + '() {\n';
    modifiedContent = fncName + modifiedContent + '\n}';
  }

  return getStartDelimiter(fileInfo.count, fileInfo.ino, fileInfo.file, fileInfo.fileName)
    + modifiedContent
    + getEndDelimiter();
}
function readInclude(fileInfo, include) {
  include.file = resolveFile(include.file, fileInfo.dir, fileInfo.file);
  let includeContent = fs.readFileSync(include.file, 'utf8');
  if (include.file.substring(include.file.length - 3) === '.js')
    return includeContent;
  return '`' + includeContent.replace(/\s+/g, ' ') // remove useless spaces
      .replace(/`/g, "\\`") // add backslash to backtick (`) character
    + '`';
}

function resolveFile(fileToResolve, basedir, parentFile) {
  if (fileToResolve[0] === '\\' || fileToResolve[0] === '/') {
    fileToResolve = basedir + fileToResolve;
  } else {
    try {
      fileToResolve = resolve.sync(fileToResolve, {basedir});
    } catch (e) {
      console.error('\nError found in ' + parentFile);
      console.error(e);
    }
  }
  return fileToResolve;
}

function getStartDelimiter(n, ino, filepath, filename) {
  return `

//------------------------------------------------
// #${n}
// ino: ${ino}
// filepath: ${filepath}
//region ${filename}

`;
}
function getEndDelimiter() {
  return '\n//endregion';
}
