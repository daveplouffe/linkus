const BuildRemover = require('../core/BuildRemover');

const buildRemoverCommand = {
  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    let remover = new BuildRemover(linkus.context.outputParts.path, 5);
    let name = linkus.context.outputParts.fileName;
    name = name.substring(0, name.indexOf('.'));
    remover.removeBuilds('^' + name + '.*' + linkus.context.outputParts.extension)
  }
};

module.exports = buildRemoverCommand;