const fs = require('fs');

let BuildRemover = function (directoryPath, nbrOfOldBuilds = 5) {

  function removeBuilds(match) {
    return getBuildFiles(match).then(function (buildFiles) {
      for (let i = 0; i < buildFiles.length - nbrOfOldBuilds; i++) {
        fs.unlinkSync(directoryPath + buildFiles[i]);
      }
    });
  }

  function getBuildFiles(match) {
    return new Promise(function (resolve) {
      let files = fs.readdirSync(directoryPath);
      let result = [];
      match = new RegExp(match);
      files.forEach(function (file) {
        if (file.match(match))
          result.push(file);
      });
      resolve(result);
    })
  }

  return {
    removeBuilds
  }
};

module.exports = BuildRemover;
