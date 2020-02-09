const Utils = require('../helpers/utils');
let FileMapping = function (linkus) {

  function isFileMappingEnabled() {
    return linkus.props.fileMapping.enabled;
  }

  function applyMapping(files) {
    if (!isFileMappingEnabled()) return;
    let N = files.length;
    let filesToMap = linkus.props.fileMapping.files;
    filesToMap.forEach(function (fileToMap) {
      fileToMap.from = fileToMap.from.replace(/\//g, '\\');
      for (let i = 0; i < N; i++) {
        let file = files[i].file;
        if (Utils.endsWith(file, fileToMap.from)) {
          files[i].file = file.substring(0, file.length - fileToMap.from.length) + fileToMap.to;
          break;
        }
      }
    });
  }

  return {
    isFileMappingEnabled,
    applyMapping
  }
};
module.exports = FileMapping;