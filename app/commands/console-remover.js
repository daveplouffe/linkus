const consoleRemover = {
  regex: /\bconsole\b\.[\s\S]+?\);?/g,

  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    if (linkus.context.curFile.fileInfo.extension === '.js') {
      linkus.context.curFile.content =
        linkus.context.curFile.content.replace(consoleRemover.regex, '');
    }
  }
};

module.exports = consoleRemover;