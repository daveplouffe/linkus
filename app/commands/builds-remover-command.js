const BuildRemover = require('../core/BuildRemover');

const buildRemoverCommand = {
  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    let count = linkus.props.oldBuildCount || 1;
    if (count <= 0) count = 1;
    let remover = new BuildRemover(linkus.context.outputParts.path, count);
    let name = linkus.context.outputParts.fileName;
    remover.removeBuilds('^' + name + '.*' + linkus.context.outputParts.extension)
  }
};

module.exports = buildRemoverCommand;