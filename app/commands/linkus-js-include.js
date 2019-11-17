let jsInclude = require('../core/js-include');

const linkusJsInclude = {

  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    if (linkus.context.curFile.fileInfo.extension === '.js') {
      linkus.context.curFile.content =
        jsInclude.execute({
          content: linkus.context.curFile.content,
          file: linkus.context.curFile.fileInfo.file,
          basedir: linkus.context.curFile.fileInfo.dir,
          linkus: linkus
        })
    }
  }
};

module.exports = linkusJsInclude;