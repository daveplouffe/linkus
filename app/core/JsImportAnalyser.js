/**
 * Autor: Dave
 * Date: 04/02/2022
 */

const jsImportType = {
  includes: 1,
  imports: 2,
  requires: 3,
  exports: 4,
  defaultExport: 5
}

// thoses requires are skipped
const nodeBuildInModules = {
  'process': 1, 'http2': 1, 'fs': 1
}

function jsImportAnalyser(jsToken) {
  let tokens = [];
  let tokenIn = [];
  let tokenOut = [];
  let tokenInclude = [];
  let i, N, tokenList, curToken, curValue;

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
  return {
    tokenOrder:tokens,
    tokenIn,
    tokenOut,
    tokenInclude
  };

  function importStage() {
    let importToken = {
      index: curToken.index,
      file: '',
      length: 0,
      type: jsImportType.imports,
      variables: [],
      hasDefault: true
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if(curToken.value==='{') {
        if(importToken.variables.length ===0)
          importToken.hasDefault = false;
      }
      else if (curToken.type === 3 /* word */ && curToken.value !== 'from') {
        importToken.variables.push(curToken.value);
      } else if (curToken.type === 4 /* string */) {
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
      tokenIn.push(importToken);
    }
  }

  function requireStage() {
    let requireToken = {
      index: curToken.index,
      file: '',
      length: 0,
      type: jsImportType.requires,
      isDefault: true
    };

    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 4) {
        requireToken.file = curToken.value;
        if (nodeBuildInModules[curToken.value]) return;
        break;
      }
    }
    for (i++; i < N; i++) {
      curToken = tokenList[i];
      if (curToken.type === 9) {
        requireToken.length = curToken.index - requireToken.index + 1;
        tokens.push(requireToken);
        tokenIn.push(requireToken);
        break;
      }
    }
    if (tokenList[i + 1].value === '.')
      requireToken.isDefault = false;
  }

  /**
   * // Exporting individual features
   * export [var,let,const,class,function] name = ...;
   *
   * // Export list
   * export { name1, name2, …, nameN };
   *
   * // Default exports
   * export default expression;
   **/
  function exportStage() {
    let exportToken = {
      index: curToken.index,
      length: 0,
      type: jsImportType.exports,
      variables: []
    }
    if (++i === N) return;
    tokens.push(exportToken);
    tokenOut.push(exportToken);
    curToken = tokenList[i];
    curValue = curToken.value;
    if (curValue === 'default') {
      exportToken.type = jsImportType.defaultExport;
      for (i++; i < N; i++) {
        curToken = tokenList[i];
        curValue = tokenList[i].value;
        if (curValue === ';') {
          break;
        } else {
          exportToken.variables.push(curValue);
        }
      }
      exportToken.length = curToken.index + curToken.length - exportToken.index;
    } else if (['var', 'let', 'const', 'class', 'function'].indexOf(curValue) !== -1) {
      exportToken.length = tokenList[i - 1].length;
      exportToken.variables.push(tokenList[i + 1].value);
    } else if (curValue === '{') {
      for (i++; i < N; i++) {
        curToken = tokenList[i];
        if (curToken.value === '}') break;
        if (curToken.type === 3 /* word */)
          exportToken.variables.push(curToken.value);
      }
      exportToken.length = curToken.index + curToken.length - exportToken.index;
      if (tokenList[i + 1] && tokenList[i + 1].value === ';') exportToken.length += 1;
    }
  }

  /**
   * module.exports = name;
   * module.exports = {name};
   * module.exports = {name1, name2, ...}
   */
  function nodeJsExport() {
    if (i - 2 < 0 || tokenList[i - 2].value !== 'module') return;
    let exportToken = {
      index: tokenList[i - 2].index,
      length: 0,
      type: jsImportType.exports,
      variables: []
    }

    i++;
    if(tokenList[i] && tokenList[i].value==='=') {
      i++
      // is this form: module.exports = name;
      if (i<N && tokenList[i].type === 3 && (i+1===N || tokenList[i + 1].value === ';')) {
        exportToken.type = jsImportType.defaultExport;
        exportToken.length = tokenList[i].index+tokenList[i].length - exportToken.index;
        if(i+1<N && tokenList[i+1].value===';') exportToken.length += 1;
        exportToken.variables.push(tokenList[i].value);
        tokens.push(exportToken);
        tokenOut.push(exportToken);
        return;
      }

      // is this form: module.exports = {name,...}
      if(tokenList[i].value === '{') {
        for(i++; i<N; i++) {
          if(tokenList[i].type===3 /* word */)
            exportToken.variables.push(tokenList[i].value)
          else if(tokenList[i].value === '}') break;
        }
        exportToken.length = tokenList[i].index + tokenList[i].length - exportToken.index;
        if(tokenList[i+1] && tokenList[i+1].value === ';') exportToken.length+=1;
        tokens.push(exportToken);
        tokenOut.push(exportToken);
      }

    }

  }

  function linkusIncludeStage() {
    let includeToken = {
      index: curToken.index,
      file: '',
      length: 0,
      type: jsImportType.includes
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
        tokens.push(includeToken)
        tokenInclude.push(includeToken);
        break;
      }
    }
  }

}

module.exports = {jsImportAnalyser, jsImportType};