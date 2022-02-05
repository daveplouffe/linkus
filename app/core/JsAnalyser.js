/**
 * Autor: Dave
 * Date: 07/11/2017.
 */

const JsAnalyser = function () {
  const codeTypeClassname = {
    1: 'operator',
    2: 'conditional', // logical?
    3: 'word',
    4: 'string',
    5: 'regex',
    6: 'comment',
    7: 'comment',
    8: 'number',
    9: 'syntax',
    10: 'reserved',
    11: 'reserved-property',
    12: 'property',
    13: 'number',
    14: 'reserved-object',
    15: 'function',
    16: 'parameter',
    17: 'variable-declaration',
    18: 'variable',
  }
  const CodeType = {
    operator: 1,
    conditional: 2,
    word: 3,
    string: 4,
    regex: 5,
    comment: 6,
    multicomment: 7,
    number: 8,
    syntax: 9,
    reservedWord: 10,
    reservedProperty: 11,
    wordProperty: 12,
    hexNumber: 13,
    reservedObject: 14,
    function: 15,
    parameter: 16,
    variableDeclaration: 17,
    variable: 18,
  }
  const reservedWords = {
    'let': 1,
    'var': 1,
    'const': 1,
    'function': 1,
    'instanceof': 1,
    'typeof': 1,
    'return': 1,
    'do': 1,
    'for': 1,
    'coninue': 1,
    'break': 1,
    'while': 1,
    'this': 1,
    'null': 1,
    'export': 1,
    'import': 1,
    'from': 1,
    'true': 1,
    'false': 1,
    'try': 1,
    'catch': 1,
    'finally': 1,
    'goto': 1,
    'throw': 1,
    'void': 1,
    'class': 1,
    'default': 1,
    'delete': 1,
    'in': 1,
    'if': 1,
    'else': 1,
    'switch': 1,
    'new': 1,
    'super': 1,
    'case': 1,
    'eval': 1,
    'require': 1
  };
  const objectWord = {
    'document': 1,
    'window': 1,
    'JSON': 1,
    'Error': 1,
    'Array': 1,
    'String': 1,
    'TypeError': 1,
    'Object': 1,
    'encodeURIComponent': 1,
    'decodeURIComponent': 1,
    'clearTimeout': 1,
    'setTimeout': 1,
    'setInterval': 1,
    'clearInterval': 1,
    'undefined': 1,
    'console': 1,
    'ActiveXObject': 1,
    'Math': 1,
    'XMLHttpRequest': 1,
    'Date': 1,
    'navigator': 1,
    'localStorage': 1,
    'location': 1,
    'RegExp': 1,
    'cookie': 1,
    'Number': 1,
    'Function': 1,
    'arguments': 1,
    'body': 1,
  };
  const reservedProperties = {
    'alert': 1,

    //console
    'log': 1,

    // JSON
    'stringify': 1,
    'parse': 1,

    //object
    'valueOf': 1,
    'charCodeAt': 1,
    'prototype': 1,
    'defineProperty': 1,
    'configurable': 1,
    'writable': 1,
    'enumerable': 1,
    'keys': 1,

    //localStorage
    'getItem': 1,
    'setItem': 1,
    'removeIem': 1,

    // elements
    'tagName': 1,
    'getElementById': 1,
    'getElementsByTagName': 1,
    'getElementsByClassName': 1,
    'nodeType': 1,
    'querySelector': 1,
    'querySelectorAll': 1,
    'style': 1,
    'createElement': 1,
    'offsetTop': 1,
    'offsetHeight': 1,
    'offsetLeft': 1,
    'getAttribute': 1,
    'value': 1,
    'src': 1,
    'async': 1,
    'innerHTML': 1,
    'innerText': 1,
    'select': 1,
    'lastIndex': 1,
    'id': 1,
    'placeholder': 1,
    'type': 1,
    'name': 1,
    'title': 1,
    'width': 1,
    'height': 1,
    'firstChild': 1,
    'insertBefore': 1,
    'appendChild': 1,
    'removeChild': 1,
    'parentNode': 1,
    'childNodes': 1,
    'children': 1,
    'href': 1,

    //events
    'stopPropagation': 1,
    'preventDefault': 1,
    'attachEvent': 1,
    'detachEvent': 1,
    'target': 1,
    'onbeforeunload': 1,
    'onblur': 1,
    'ondragdrop': 1,
    'onclick': 1,
    'oncontextmenu': 1,
    'onerror': 1,
    'onfocus': 1,
    'onkeydown': 1,
    'onkeypress': 1,
    'onkeyup': 1,
    'onchange': 1,
    'onload': 1,
    'onmousedown': 1,
    'onmouseup': 1,
    'onreset': 1,
    'onsubmit': 1,
    'onunload': 1,
    'keyCode': 1,
    'addEventListener': 1,
    'removeEventListener': 1,
    'call': 1, 'bind': 1, 'apply': 1,
    'setAttribute': 1,
    'nodeName': 1,
    'srcElement': 1,

    //strings
    'replace': 1,
    'substring': 1,
    'substr': 1,
    'charAt': 1,
    'localeCompare': 1,
    'split': 1,
    'trim': 1,
    'toLowerCase': 1,
    'toUpperCase': 1,

    //error
    'stack': 1,

    //regex
    'test': 1, // regex.text()
    'exec': 1,
    'match': 1,
    'className': 1,

    //arrays
    'indexOf': 1,
    'push': 1,
    'pop': 1,
    'length': 1,
    'join': 1,
    'concat': 1,
    'find': 1,
    'findIndex': 1,
    'forEach': 1,
    'reduce': 1,
    'shift': 1,
    'slice': 1,
    'sort': 1,
    'splice': 1,
    'isArray': 1,
    'lastIndexOf': 1,

    //Math
    'min': 1,
    'max': 1,
    'floor': 1,
    'ceil': 1,
    'round': 1,
    'Infinity': 1,
    'isNaN': 1,
    'sqrt': 1,
    'sign': 1,
    'PI': 1,
    'cos': 1, 'sin': 1, 'tan': 1,
    'acos': 1, 'asin': 1, 'atan': 1,
    'random': 1, 'abs': 1,

    //XMLHttpRequest
    'withCredentials': 1,
    'setRequestHeader': 1,
    'readyState': 1,
    'status': 1,
    'open': 1,
    'send': 1,
    'responseText': 1,
    'onreadystatechange': 1,

    //Date
    'getTime': 1,
    'toGMTString': 1,
    'getYear': 1,
    'getDate': 1,
    'getHours': 1,
    'getMinutes': 1,
    'getTimezoneOffset': 1,

    //style
    'top': 1,
    'left': 1,
    'right': 1,
    'bottom': 1,
    'offsetWidth': 1,
  };

  let N, content, curIndex, strQuote;
  let operators = '!=+*/-<>|^&?%~';
  let wordStart = /[a-z$_]/i;
  let wordDelemiter = ' .,;:"\'/{}[]()\n' + operators;
  let nbOfElementFound, startIndex;
  let tokens, parentesisCounter;
  let a, b, c, doStage;

  return {
    CodeType,
    highlightByChunk(element) {
      let str = element.textContent;
      let tokens = this.execute({fileContent: str});
      let offset = 0;
      let chunkSize = 1500;
      let nChunkProcessed = 0;
      tokens = this.analyseTokens(tokens);
      let n = tokens.length;

      function processChunk() {
        let i, token, tokenValue, newValue;
        let end = nChunkProcessed + chunkSize;
        let strChunk = '';
        for (i = nChunkProcessed; i < end; i++) {
          if (i === n) break;
          token = tokens[i];
          tokenValue = encodeHtmlEntities(token.value);
          if (tokenValue === '\n')
            newValue = '<br>';
          else
            newValue = '<span '
              + 'id="' + i + '" '
              + 'class="' + codeTypeClassname[token.type] + '" '
              + 'title="' + codeTypeClassname[token.type] + '">'
              + tokenValue
              + '</span>';
          strChunk += str.substring(offset, token.index) + newValue;
          offset += token.value.length + (token.index - offset);
        }
        nChunkProcessed += chunkSize;
        element.innerHTML += strChunk;
        if (i !== n) setTimeout(processChunk, 100);
      }

      element.innerHTML = '';
      processChunk();
    },
    highlight(str) {
      let tokens = this.execute({fileContent: str});
      let n = tokens.length;
      let offset = 0;
      for (let i = 0; i < n; i++) {
        if (i === n) break;
        let curArr = tokens[i];
        let arrValue = curArr.value;
        arrValue = encodeHtmlEntities(arrValue);
        let newValue = '';
        if (curArr.type === CodeType.syntax && arrValue === '\n') {
          newValue = '<br>';
        } else {
          newValue = '<span id="' + i + '" class="' + codeTypeClassname[curArr.type] + '" title="' + codeTypeClassname[curArr.type] + '">' + arrValue + '</span>';
        }
        str = str.substring(0, curArr.index + offset)
          + newValue
          + str.substring(curArr.index + curArr.value.length + offset);

        offset += (newValue.length - curArr.value.length);
      }
      return str;
    },

    analyseTokens(tokens) {
      let i, n = tokens.length;
      let curToken = null, curValue;
      let stateQueue = [];
      let closure = [];
      let variables = {};
      let stateFnc = initState;
      wordTypeToBetterType();
      for (i = 0; i < n; i++)
        stateFnc()
      return tokens;

      function wordTypeToBetterType() {
        for (i = 0; i < n; i++) {
          curToken = tokens[i];
          if (curToken.type === CodeType.word) {
            if (reservedWords[curToken.value]) {
              curToken.type = CodeType.reservedWord;
            } else if (i > 0 && tokens[i - 1].value === '.') {
              if (reservedProperties[curToken.value]) {
                curToken.type = CodeType.reservedProperty;
              } else {
                curToken.type = CodeType.wordProperty;
              }
            } else if (objectWord[curToken.value]) {
              curToken.type = CodeType.reservedObject;
            }
          }
        }
      }

      function initState() {
        curToken = tokens[i];
        if (curToken.type === CodeType.reservedWord) {
          if (curToken.value === 'function') {
            stateFnc = functionParameterState;
            stateQueue.push(initState);
            tokens[++i].type = CodeType.function;
            closure.push = i;
          } else if (['let', 'var', 'const'].indexOf(curToken.value) !== -1) {
            stateFnc = variableState;
            stateQueue.push(initState);
          }
        } else if (curToken.value === ',' && stateQueue.length > 0) {
          stateFnc = stateQueue.pop();
        } else if (curToken.value === ';' && stateQueue.length > 0) {
          stateQueue.pop();
          stateFnc = initState;
        } else if (curToken.value === '(') {
          stateFnc = functionCallState;
          stateQueue.push(initState);
        } else if (curToken.type === CodeType.word) {
          if (variables[curToken.value]) {
            curToken.type = CodeType.variable;
          }
        }
      }

      function functionParameterState() {
        for (; i < n; i++) {
          curToken = tokens[i];
          if (curToken.type === CodeType.syntax && curToken.value === ')') {
            stateFnc = stateQueue.pop();
            break;
          } else if (curToken.type === CodeType.word) {
            curToken.type = CodeType.parameter;
          }
        }
      }

      function variableState() {
        for (; i < n; i++) {
          curToken = tokens[i];
          if (curToken.type === CodeType.word) {
            curToken.type = CodeType.variableDeclaration;
            variables[curToken.value] = 1;
          } else if (curToken.value === ';') {
            stateFnc = stateQueue.pop();
            break;
          } else if (curToken.value === '=') {
            stateFnc = initState;
            stateQueue.push(variableState);
            break;
          }
        }
      }

      function functionCallState() {
        for (; i < n; i++) {
          curToken = tokens[i];
          if (curToken.value === ')') {
            stateFnc = stateQueue.pop();
            break;
          } else if (curToken.type === CodeType.word) {
            if (variables[curToken.value]) {
              curToken.type = CodeType.variable;
            }
          }
        }
      }

    },

    /**
     * @param {{fileContent}} args
     * @return {string} modified content
     */
    execute(args) {
      if (typeof args === "string")
        content = args;
      else
        content = args.fileContent;

      N = content.length;
      operators = '!=+*/-<>|^&?%~';
      wordStart = /[a-z$_]/i;
      wordDelemiter = ' .,;:"\'/{}[]()\n' + operators;
      nbOfElementFound = -1;
      curIndex = 0;
      strQuote = '';
      startIndex = 0;
      tokens = [];
      parentesisCounter = 0;
      doStage = detectionStage;

      for (curIndex = 0; curIndex < N; curIndex++) {
        c = content[curIndex - 2];
        b = content[curIndex - 1];
        a = content[curIndex];
        doStage();
      }
      a = null;
      doStage();

      return tokens;
    }
  }

  function detectionStage() {
    if (a === "'" || a === '"' || a === '`') {
      startIndex = curIndex + 1;
      strQuote = content[curIndex];
      doStage = strStage;
    } else if (a === '/') {
      startIndex = curIndex;
      doStage = stageSlash;
    } else if (wordStart.test(a)) {
      startIndex = curIndex;
      doStage = stageWord;
    } else if (operators.indexOf(a) !== -1) {
      startIndex = curIndex;
      doStage = stageOperator;
    } else if (a !== ' ' && wordDelemiter.indexOf(a) !== -1) {
      startIndex = curIndex;
      if (a === '(') parentesisCounter++;
      else if (a === ')') parentesisCounter--;
      pushValue(curIndex + 1, CodeType.syntax);
    } else if (/[0-9]/.test(a)) {
      startIndex = curIndex;
      doStage = stageNumber;
    }
  }

  function stageSlash() {
    if (a === '/') {
      doStage = simpleCommentStage;
    } else if (a === '*' && c !== '\\') {
      doStage = multiCommentStage;
    } else {
      let lastType;
      let lastValue;
      if (nbOfElementFound >= 0) {
        lastType = tokens[nbOfElementFound].type;
        lastValue = tokens[nbOfElementFound].value;
      } else {
        lastType = CodeType.syntax;
        lastValue = '';
      }
      if ((lastType === CodeType.syntax
          || lastType === CodeType.operator
          || lastType === CodeType.comment)
        && !/[)\]]/.test(lastValue)) {
        doStage = regexStage
      } else {
        doStage = stageOperator;
        curIndex--;
      }
    }
  }

  function stageOperator() {
    if (operators.indexOf(a) === -1) {
      pushValue(curIndex, CodeType.operator);
      curIndex--;
    }
  }

  function stageNumber() {
    if (a === 'x' && b === '0') {
      doStage = hexNumberStage;
    } else if (!/[0-9.e]/i.test(a)) {
      pushValue(curIndex, CodeType.number);
      curIndex--;
    }
  }

  function hexNumberStage() {
    if (!/[0-9a-f]/i.test(a)) {
      pushValue(curIndex, CodeType.hexNumber);
      curIndex--;
    }
  }

  function stageWord() {
    if (wordDelemiter.indexOf(a) !== -1 || a == null) {
      pushValue(curIndex, CodeType.word);
      curIndex--;
    }
  }

  function strStage() {
    if ((b !== "\\" && a === strQuote) || (c === '\\' && a === strQuote)) {
      pushValue(curIndex, CodeType.string);
      tokens[nbOfElementFound].quote = strQuote;
    }
  }

  function regexStage() {
    if (a === '[') {
      doStage = regexBraket;
    } else if (a === '/') {
      if (b === '\\') {
        if (c === '\\') {
          doStage = regexflags;
        }
      } else {
        doStage = regexflags;
      }
    }
  }

  function regexBraket() {
    if (a === ']') {
      if (b === '\\') {
        if (c !== '\\') {
          doStage = regexStage;
        }
      } else {
        doStage = regexStage;
      }
    }
  }

  function regexflags() {
    if (!/[a-z]/.test(a)) {
      pushValue(curIndex, CodeType.regex);
      curIndex--;
    }
  }

  function simpleCommentStage() {
    if (a === '\n' || a === null) {
      pushValue(curIndex, CodeType.comment);
      curIndex--;
    }
  }

  function multiCommentStage() {
    if (b === '*' && a === "/") {
      pushValue(curIndex + 1, CodeType.multicomment);
    }
  }

  function pushValue(index, type) {
    tokens.push({
      value: content.substring(startIndex, index),
      index: startIndex,
      length: index - startIndex,
      type: type
    });
    nbOfElementFound++;
    doStage = detectionStage;
  }

  function encodeHtmlEntities(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

}();

module.exports = JsAnalyser;

