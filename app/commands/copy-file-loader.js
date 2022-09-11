const path = require('path');
const Utils = require('../helpers/utils');
const cliUtils = require('../helpers/cli-utils');

const copyFileLoader = {

  /**
   * @param {Linkus} linkus
   * @param {curFile, dependencyOrder, entry, output} linkus.context
   * @param {info, content} linkus.context.curFile
   */
  execute(linkus) {
    // extension des fichiers qui seront copier.
    // NOTE: pour qu'un type de fichier soit trouvé dans un fichier javascript,
    // il faut modifier les extensions accepter par le link-resolver
    let ext = [
      '.secret',
      '.png',
      '.bmp',
      '.jpg',
      '.jpeg'
    ];
    if (ext.indexOf(linkus.context.curFile.info.extension) !== -1) {
      let relativePath = Utils.getRelativePath(linkus.context.curFile.info.file, linkus.props.php.serverDocumentRoot);
      let dest = path.normalize(path.dirname(linkus.context.output) + relativePath);
      Utils.createFolders(path.dirname(dest));
      cliUtils.copy(linkus.context.curFile.info.file, dest);
      linkus.context.curFile.content = '';
    }
  },

};

module.exports = copyFileLoader;