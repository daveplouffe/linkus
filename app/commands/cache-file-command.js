const DependencyCached = require('../core/DependencyCached');

const cacheFile = {
  /**
   * @param {Linkus} linkus
   */
  execute(linkus) {
    let cached = new DependencyCached(linkus);
    cached.saveFile(linkus.context.curFile.fileInfo.ino, linkus.context.curFile.content);
  }
};

module.exports = cacheFile;