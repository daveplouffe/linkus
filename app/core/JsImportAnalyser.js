/**
 * Autor: Dave
 * Date: 04/02/2022
 */

const JsImportType = {
  imports: 1,
  requires:2,
  exports: 3,
  defaultExport:4,
  includes: 5
}

const JsImportAnalyser = function () {
  let tokens = [];
  let i, N, tokenList, curToken, curValue;

  function execute(jsToken) {
    tokenList = jsToken;
    tokens = [];
    N = jsToken.length;
    for (i = 0; i < N; i++) {
      curToken = jsToken[i];
      if (curToken.type === 3 /* word */) {
        curValue = curToken.value;
        if (curValue === 'import') {
          importStage();
        } else if (curValue === 'require') {
          requireStage();
        } else if (curValue === 'export') {
          exportStage();
        } else if (curValue === 'exports') {
          nodeJsExport();
        } else if (curValue === 'linkus_include') {
          linkusIncludeStage();
        }

      }
    }
    return tokens;
  }

  function importStage() {
    let importToken = {
      index: curToken.index,
      file: '',
      length: 0,
      type: JsImportType.imports
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 4 /* string */) {
        importToken.file = curToken.value;
        break;
      }
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 9 /* syntax */) {
        importToken.length = curToken.index - importToken.index + 1;
        break;
      }
    }
    if (importToken.file) {
      if (i === N) // is last token reached
        importToken.length = tokenList[N - 1].index + tokenList[N - 1].length - importToken.index;
      tokens.push(importToken);
    }
  }

  function requireStage() {
    let requireToken = {
      index: curToken.index,
      file: '',
      length: 0,
      type: JsImportType.requires
    };
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 4) {
        requireToken.file = curToken.value;
        if(['..','./'].indexOf(curToken.value.substr(0,2)) === -1)  return;
        break;
      }
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 9) {
        requireToken.length = curToken.index - requireToken.index + 1;
        tokens.push(requireToken);
        break;
      }
    }

  }

  function exportStage() {
    let exportToken = {
      index: curToken.index,
      length: 0,
      value: '',
      type: JsImportType.defaultExport
    }
    if(++i===N) return;
    let exportValue = '';
    curToken = tokenList[i];
    curValue = curToken.value;
    if (curValue === 'default') {
      for (i++; i < N; i++) {
        curToken = tokenList[i];
        curValue = tokenList[i].value;
        if (curToken.type === 9 && (curValue === ';' || curValue === '\n')) {
          break;
        } else {
          exportValue += curValue;
        }
      }
      exportToken.value = exportValue;
      exportToken.length = curToken.index + curToken.length - exportToken.index;
      tokens.push(exportToken);

    } else if(['var','let','const','class','function'].indexOf(curValue) !== -1) {
      exportToken.length = tokenList[i-1].length;
      exportToken.type = JsImportType.exports
      tokens.push(exportToken);
    }
  }

  function nodeJsExport() {
    if(i-2<0 || tokenList[i-2].value !== 'module') return;
    let exportToken = {
      index: tokenList[i-2].index,
      length: 0,
      value: '',
      type: JsImportType.defaultExport
    }

    // is this combination found?
    // module.exports = something ;
    if(i+3 >= N) return;
    if(tokenList[i+1].value==='=' && tokenList[i+2].type === 3 && tokenList[i+3].value===';') {
      exportToken.value = tokenList[i+2].value;
      exportToken.length = tokenList[i+3].index - exportToken.index + 1;
      tokens.push(exportToken);
      return;
    }
    let exportedValue = '';
    for(i++;i<N;i++) {
      curToken = tokenList[i];
      if(curToken.value === '=')
        break;
    }
    for(i++;i<N;i++) {
      curToken = tokenList[i];
      if(curToken.value === ';') break;
      exportedValue += curToken.value
    }
    exportToken.length = curToken.index - exportToken.index+1;
    exportToken.type = JsImportType.exports;
    tokens.push(exportToken);
  }

  function linkusIncludeStage() {
    let includeToken = {
      index: curToken.index,
      file: '',
      length: 0,
      type: JsImportType.includes
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 4) {
        includeToken.file = curToken.value;
        break;
      }
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 9) {
        includeToken.length = curToken.index - includeToken.index + 1;
        tokens.push(includeToken);
        break;
      }
    }
  }

  return execute;
}();

module.exports = {JsImportAnalyser, JsImportType};