const path = require('path');
const Utils = require('../helpers/utils');
const cliUtils = require('../helpers/cli-utils');

const htAccessLoader = {

  /**
   * @param {Linkus} linkus
   * @param {curFile, dependencyOrder, entry, output} linkus.context
   * @param {basedir, content, extension, file} linkus.context.curFile
   */
  execute(linkus) {
    if (linkus.context.curFile.info.extension === '.htaccess') {
      let relativePath = Utils.getRelativePath(linkus.context.curFile.info.file, linkus.props.php.serverDocumentRoot);
      let dest = path.normalize(path.dirname(linkus.context.output) + relativePath);
      Utils.createFolders(path.dirname(dest));
      cliUtils.copy(linkus.context.curFile.info.file, dest);
      linkus.context.curFile.content = '';
    }
  },

};

module.exports = htAccessLoader;