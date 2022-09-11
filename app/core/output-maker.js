//region imports
const fs = require('fs');
const Utils = require('../helpers/utils');
const eventbus = require('../helpers/eventbus.js');
const LinkusEvent = require('./linkus-event');
const SourceMapGenerator = require("source-map/dist/source-map").SourceMapGenerator;
//endregion

/**
 * @param props
 * @constructor
 */
let OutputMaker = function (props) {
  this.props = {
    regexImportRemover: /^ *((?:\bimport\b[\s\S]*?['"][\s;]+?)|(?:\bexport\b[\s]*(?: *\bdefault\b[\s]*)?(?:(?=\b(?:function|const|let|var)\b)|[ \S]+?[ ;}]+))|(?:\bmodule\.exports\b[ ]+=.+[; ]+?)|(?:const|var|let).+=[\s]*\brequire\b.*.+?\)[; ]*)/gmi,
    fileEncoding: 'utf8'
  };
  Utils.extend(this.props, props);
};
module.exports = OutputMaker;

/**
 * @param {{
 *      supportedFileExtensions,
 *      regexImportRemover
 * }=} props
 * @param {regex} props.regexImportRemover by default is set to remove imports of ES6 only.
 * @return {OutputMaker}
 */
OutputMaker.create = function (props) {
  return new OutputMaker(props);
};

Utils.inherit(OutputMaker, function () {

  let nbOfFiles = 0;

  function doMakeOutput(outputMaker, options) {
    // js import remover regex explication
    /* good to know that form
     (?:                                     if #1
     (?=                                 condition
     positive-regex-statement        successfull
     ) then                              do that
     |                                   OR
     (?!                                 if
     negavite-regex-statement        this is successfull
     ) then                             do that
     )                                      end if #1
     */

    if(options.linkus.props.sourcemap)
      _makeOutputWithSourceMap(outputMaker, options);
    else
      _makeOutputOnly(outputMaker, options);

  }

  function doMakeOutputFromCached(outputMaker, linkus) {
    fs.writeFileSync(linkus.context.output, '', 'utf8');
    let dependencies = linkus.cached.getDependencies();
    dependencies.forEach(function (fileInfo) {
      let content = linkus.cached.loadFile(fileInfo.ino);
      fileInfo.filePart = Utils.breakFullPathFile(fileInfo.file);
      //content = getFormattedFileContent(outputMaker, fileInfo, index);
      fs.appendFileSync(linkus.context.output, content, 'utf8');
    });
  }

  function _makeOutputWithSourceMap(outputMaker,options) {
    let linkus = options.linkus;
    let dependencyOrder = options.dependencyOrder;
    let nLines, content, numberOfLines = 10;
    let map = new SourceMapGenerator({file: linkus.context.output});
    nbOfFiles = dependencyOrder.length-1;
    let buffer = '';
    for (let i = 0; i <= nbOfFiles; i++) {
      dependencyOrder[i].count = i;
      content = outputMaker.formatFileContent(linkus, dependencyOrder[i]);
      nLines = content.split('\n').length;
      let src = Utils.getRelativePath(dependencyOrder[i].file,linkus.props.basedir);
      for(let k=0; k<nLines; k++) {
        map.addMapping({
          generated: {line: numberOfLines + k, column: 0},
          source: src,
          original: {line: 1 + k, column: 0}
        });
      }
      numberOfLines += nLines-1;
      buffer += content;
    }
    buffer += '\n\n//# sourceMappingURL='+linkus.context.outputParts.fileNameWithVersion+'.js.map';
    fs.writeFileSync(options.output+'.map', map.toString(), 'utf8');
    fs.writeFileSync(options.output, buffer, 'utf8');
  }

  function _makeOutputOnly(outputMaker, options) {
    let linkus = options.linkus;
    let dependencyOrder = options.dependencyOrder;
    let content, buffer = '';
    nbOfFiles = dependencyOrder.length-1;
    for (let i = 0; i <= nbOfFiles; i++) {
      dependencyOrder[i].count = i;
      content = outputMaker.formatFileContent(linkus, dependencyOrder[i]);
      buffer += content;
    }
    fs.writeFileSync(options.output, buffer, 'utf8');
  }

  function formatFileContent(linkus, fileInfo) {
    let curFile = {info: fileInfo, content:''};
    let jsExports, jsDefaultExport;

    if(linkus.props.modularImport) {
      jsExports = fileInfo.analyse.tokenOut.reduce((a, c) => (c.type===4 ? a +','+c.variables.join(','):a), '');
      jsDefaultExport = fileInfo.analyse.tokenOut.reduce((a,c) => c.type===5 ? c.variables[0]:a,'');
      curFile.content = commentImportsAndExports(fileInfo, jsDefaultExport, jsExports);
    } else {
      curFile.content = fs.readFileSync(fileInfo.file, 'utf8').replace(this.props.regexImportRemover, '/*$1*/')
    }
    linkus.context.curFile = curFile;
    eventbus.emit(LinkusEvent.onBeforeWriteContentToOutput, linkus);
    if(linkus.props.modularImport) {

      let fncName = '__linkus_'+fileInfo.fileName.replace(/[-. ]/g,'_');
      if(jsExports || jsDefaultExport) {
        curFile.content =
          `//region ${fileInfo.count}. ${fileInfo.fileName}\n// ${fileInfo.file}\nfunction ${fncName}() { \n`
          + curFile.content
          + '\n}\n//endregion\n';
      } else {
        // last file is not wrapped in a function
        curFile.content =
          `//region ${fileInfo.count}. ${fileInfo.fileName}\n//${fileInfo.file} \n`
          + curFile.content
          + '\n//endregion\n';
      }

    } else {
      curFile.content = getStartDelimiter(fileInfo.count, fileInfo.ino, fileInfo.file, fileInfo.fileName)
        + curFile.content
        + getEndDelimiter();
    }
    fileInfo.bytes = curFile.content.length;
    return curFile.content;
  }

  function getStartDelimiter(n,ino,filepath,filename) {
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

  function commentImportsAndExports(fileInfo, jsDefaultExport, jsExports) {
    let fileContent = fs.readFileSync(fileInfo.file, 'utf8');
    let commentedContent = '';
    let cursor = 0, voffset = 0, vi;
    let tokenOffset = 0;

    ///if(fileInfo.fileName =='index') {
    ///  let i = 0;
    ///  i++;
    ///}

    fileInfo.analyse.tokenOrder.forEach((token,i) => {
      if(token.type > 1) {
        commentedContent += fileContent.substring(cursor,token.index)
          + '/*' + fileContent.substr(token.index, token.length) + '*/'
        cursor = token.index+token.length;
        tokenOffset+=2;
        token.index+=tokenOffset;

        vi = voffset + i;
        if(token.type===3) { // requires
          commentedContent+= '__linkus_'+fileInfo.vin[vi].fileName.replace(/[-. ]/g,'_') + '()';
        } else if(token.type===2) {// imports
          if(token.variables.length) {
            if(token.hasDefault === false || token.variables.length>1 || fileInfo.vin[vi].analyse.tokenOut.length>1) {
              commentedContent+= 'const {'+ token.variables.join(',') + '} = __linkus_'+fileInfo.vin[vi].fileName.replace(/[-. ]/g,'_') + '();';
            } else {
              commentedContent+= 'const '+ token.variables.join(',') + ' = __linkus_'+fileInfo.vin[vi].fileName.replace(/[-. ]/g,'_') + '();';
            }
          }
        } else if(token.type === 4 || token.type===5) voffset--;
      }

    });
    commentedContent += fileContent.substring(cursor, fileContent.length);
    if(jsExports) {
      commentedContent += '\nreturn {' + jsExports.substr(1);
      if(jsDefaultExport) commentedContent+= ','+jsDefaultExport;
      commentedContent+= '};';
    } else if(jsDefaultExport){
      commentedContent +='\nreturn '+jsDefaultExport + ';';
    }

    return commentedContent;
  }

  return {

    /**
     * Generate file containing all imported code.
     *
     * @param {dependencyOrder} options
     * @param {string} options.output
     * @param {Array<{file}>} options.dependencyOrder
     * @param {function} options.preprocessCommand function call to execute preprocessCommand
     */
    makeOutput(options) {
      doMakeOutput(this, options);
    },

    makeOutputFromCached(linkus) {
      doMakeOutputFromCached(this, linkus);
    },

    formatFileContent
  }

}());
