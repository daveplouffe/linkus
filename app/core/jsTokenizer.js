/**
 * Autor: Dave
 * Date: 07/11/2017
 * Update: 05/02/2022
 */

const jsTokenType = require('./jsTokenType');

const jsTokenizer = function () {

  let N, content, curIndex, strQuote;
  let operators = '!=+*/-<>|^&?%~';
  let wordStart = /[a-z$_]/i;
  let wordDelemiter = ' .,;:"\'/{}[]()\n\t' + operators;
  let whiteSpaces = '\t\n';
  let nbOfElementFound, startIndex;
  let tokens, parentesisCounter;
  let a, b, c, doStage;
  let includeWhiteSpace = false;

  /**
   * @param {string|{}} args
   * @param {string} args.fileContent
   * @param {boolean} args.includeWhiteSpace
   * @return {string} modified content
   */
  return function (args) {
    if (typeof args === "string")
      content = args;
    else {
      if(args.includeWhiteSpace) includeWhiteSpace = args.includeWhiteSpace;
      content = args.fileContent;
    }

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
      if (whiteSpaces.indexOf(a) !== -1) {
        if(includeWhiteSpace) pushValue(curIndex + 1, jsTokenType.whiteSpace);
      } else
        pushValue(curIndex + 1, jsTokenType.syntax);
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
        lastType = jsTokenType.syntax;
        lastValue = '';
      }
      if ((lastType === jsTokenType.syntax
          || lastType === jsTokenType.operator
          || lastType === jsTokenType.comment)
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
      pushValue(curIndex, jsTokenType.operator);
      curIndex--;
    }
  }

  function stageNumber() {
    if (a === 'x' && b === '0') {
      doStage = hexNumberStage;
    } else if (!/[0-9.e]/i.test(a)) {
      pushValue(curIndex, jsTokenType.number);
      curIndex--;
    }
  }

  function hexNumberStage() {
    if (!/[0-9a-f]/i.test(a)) {
      pushValue(curIndex, jsTokenType.hexNumber);
      curIndex--;
    }
  }

  function stageWord() {
    if (wordDelemiter.indexOf(a) !== -1 || a == null) {
      pushValue(curIndex, jsTokenType.word);
      curIndex--;
    }
  }

  function strStage() {
    if ((b !== "\\" && a === strQuote) || (c === '\\' && a === strQuote)) {
      pushValue(curIndex, jsTokenType.string);
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
      pushValue(curIndex, jsTokenType.regex);
      curIndex--;
    }
  }

  function simpleCommentStage() {
    if (a === '\n' || a === null) {
      pushValue(curIndex, jsTokenType.comment);
      curIndex--;
    }
  }

  function multiCommentStage() {
    if (b === '*' && a === "/") {
      pushValue(curIndex + 1, jsTokenType.multicomment);
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

}();

module.exports = jsTokenizer;

