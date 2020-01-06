//region imports
const fs = require('fs');
const Utils = require('../helpers/utils');
const eventbus = require('../helpers/eventbus.js');
const LinkusEvent = require('./linkus-event');
//endregion

/**
 * @param props
 * @constructor
 */
let OutputMaker = function (props) {
  this.props = {
    regexImportRemover: /(?:^\s*\bimport\b[\s\S]*?['"][\s;]+)|(?:^[\s]*\bexport\b[\s]*(?: *\bdefault\b[\s]*)?(?:(?=\b(?:function|const|let|var)\b)|[\s\S]+?[\s;}]+))|(?:^\s*\bmodule\.exports\b[\s]+=.+[;\n]+?)|^[\s]*(?:const|var|let).+=[\s]*\brequire\b.*.+?\)[;\n]*/gmi,
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

  function doMakeOutput(outputMaker, options) {
    let linkus = options.linkus;
    let dependencyOrder = options.dependencyOrder;
    let nbOfFiles = dependencyOrder.length;

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
    /*
     (?:
     ^import.*[;\s]*
     (?:
     from.*;
     )?
     |
     ^import.*
     ;?
     $
     )
     |                                 OR
     (?:                               if #1
     ^export                        start by export
     [\s]*                          and followed by whitespaces
     (?:                            [if #2] and may be followed by
     default                     default string
     [\s]*                       and by whitespaces
     )                             [endif #2]
     ?                             condition #2 may not be present
     (?:                            if #3
     (?=                         condition #1
     \b                      start word boundary of
     (?:                             thoses
     function|const|let|var      words
     )
     \b                     end word boundary
     )                          end condition #1
     |                          OR
     [\s\S]*?                   take everything
     ;                          until you get a semi-column
     )                             end if #3
     )                                end if #1
     */
    let content;
    let buffer = "";

    for (let i = 0; i < nbOfFiles; i++) {
      dependencyOrder[i].count = i;
      content = outputMaker.formatFileContent(linkus, dependencyOrder[i]);
      buffer += content;
    }
    fs.writeFileSync(options.output, buffer, 'utf8');
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

  function formatFileContent(linkus, fileInfo) {
    let content = fs.readFileSync(fileInfo.file, 'utf8');
    content = getStartDelimiter()
        .replace('%n', '' + fileInfo.count)
        .replace('%f', fileInfo.fileName)
        .replace('%p', fileInfo.file)
        .replace('%i', fileInfo.ino)
      + content.replace(this.props.regexImportRemover, '')
      + getEndDelimiter();
    let curFile = {
      fileInfo,
      content: content
    };
    linkus.context.curFile = curFile;
    eventbus.emit(LinkusEvent.onBeforeWriteContentToOutput, linkus);
    fileInfo.bytes = curFile.content.length;
    return curFile.content;
  }

  function getStartDelimiter() {
    return '\n\n//------------------------------------------------'
      + '\n// #%n '
      + '\n// ino: %i '
      + '\n// filepath: %p'
      + '\n//------------------------------------------------'
      + '\n//region %f \n\n';
  }

  function getEndDelimiter() {
    return '\n//endregion';
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
