const consoleRemover = {
  regex: /\bconsole\b\.[\s\S]+?\);?/g,

  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    if (linkus.context.curFile.info.extension === '.js') {
      linkus.context.curFile.content =
        linkus.context.curFile.content.replace(consoleRemover.regex, '');
    }
  }
};

module.exports = consoleRemover;