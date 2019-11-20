const fs = require('fs');
const path = require('path');

let FileVersioner = function (directoryPath) {

  let version = +new Date();

  function remove(regex, nbOfOldFilesKept = 5) {
    return getFiles(regex).then(function (results) {
      for (let i = 0; i < results.length - nbOfOldFilesKept; i++) {
        fs.unlinkSync(directoryPath + results[i].file);
      }
    });
  }

  function applyVersion(match) {
    return getFiles(match).then(function (results) {
      for (let i = 0; i < results.length; i++) {
        let oldFile = directoryPath + results[i].file;
        let newFile = directoryPath + getNewFileName(results[i]);
        fs.renameSync(oldFile, newFile);
      }
    });
  }

  function updateTimeStamp() {
    version = +new Date();
  }

  function setVersion(myVersion) {
    version = myVersion;
  }

  function getFiles(regex) {
    return new Promise(function (resolve) {
      let files = fs.readdirSync(directoryPath);
      let fileFound = [];
      let match;
      files.forEach(function (file) {
        match = file.match(regex);
        if (match)
          fileFound.push({
            file,
            match
          });
      });
      resolve(fileFound);
    })
  }

  function getNewFileName(result) {
    if (result.match.length > 1) {
      return result.file.replace(result.match[1], version);
    } else {
      let fileProperties = path.parse(result.file);
      return fileProperties.name + '.' + version + fileProperties.ext;
    }
  }

  return {
    remove,
    applyVersion,
    updateTimeStamp,
    setVersion
  }
};

module.exports = FileVersioner;