const FileVersioner = require('../helpers/FileVersioner');

const buildRemoverCommand = {
  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    let count = linkus.props.oldBuildCount || 1;
    if (count <= 0) count = 1;
    let name = linkus.context.outputParts.fileName;
    let directory = linkus.context.outputParts.path;
    let fileVersioner = new FileVersioner(directory);
    let regex = new RegExp('^' + name + '.*(?<!.min)' + linkus.context.outputParts.extension+'$');
    let regexMin = new RegExp('^' + name + '.*' + '.min' + linkus.context.outputParts.extension+'$');
    let regexMinMap = new RegExp('^' + name + '.*' + '.min' + linkus.context.outputParts.extension+'.map$');
    fileVersioner.remove(regex, count);
    fileVersioner.remove(regexMin, count);
    fileVersioner.remove(regexMinMap, count);
  }
};

module.exports = buildRemoverCommand;