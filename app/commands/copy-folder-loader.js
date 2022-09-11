const path = require('path');
const fs = require('fs');
const Utils = require('../helpers/utils');
const cliUtils = require('../helpers/cli-utils');

const copyFolderLoader = {

  /**
   * @param {Linkus} linkus
   * @param {curFile, dependencyOrder, entry, output} linkus.context
   * @param {basedir, content, extension, file} linkus.context.curFile
   */
  execute(linkus) {
    // extension des fichiers qui seront copier.
    // NOTE: pour qu'un type de fichier soit trouvé dans un fichier javascript,
    // il faut modifier les extensions accepter par le link-resolver

    if (fs.lstatSync(linkus.context.curFile.info.file).isDirectory()) {
      let relativePath = Utils.getRelativePath(linkus.context.curFile.info.file, linkus.props.php.serverDocumentRoot);
      let dest = path.normalize(path.dirname(linkus.context.output) + relativePath);
      Utils.createFolders(path.dirname(dest));
      cliUtils.copy(linkus.context.curFile.info.file, dest, {isRecursive: true});
    }
  },

};

module.exports = copyFolderLoader;