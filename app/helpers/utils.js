const fs = require('fs');
const path = require('path');
const resolve = require('resolve'); // npm install resolve --save-dev

/**
 * @type {{endsWith,getRelativePath(*, *): *,getDateTimeVersion():string, getRegexResults(*=, string, function(match)=): Array, writeToFile(*=, *=): void, createFolders(*=, {isRelativeToScript?: *}=): void, appendToFile(*=, *=): void, getFileContent(*=): *, getBuildNumber(): *, isSupportedFileExtension(Array<string>, string): boolean, resolveFileWithSupportedFileExtension(*=, *, *): (*|boolean), tryResolvePath(*, *): (*|boolean), resolveRelative(*=, *=): (*|boolean), resolveModuleWithSupportedFileExtension(*=, *=, *): (*|boolean), breakFullPathFile(*=): {path: string, fileName: string, extension: string}, inherit(*, ...[*]): void, extend(Object, Object): Object, isObject(*=): *, extendDeep(*, *=): *}}
 */
const Utils = {

  getTimeDiffInSeconds(start) {
    let diff = process.hrtime(start);
    return (diff[0] * 1e9 + diff[1]) / 1e9;
  },

  endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  },

  getRelativePath(filePath, relativeTo) {
    let n = filePath.length;
    for (let i = 0; i < n; i++) {
      if (filePath[i] !== relativeTo[i]) {
        return filePath.substr(i).replace(/\\/g, "/");
      }
    }
  },

  /**
   * @param regex
   * @param {string} str
   * @param {function(match)=} onMatch, should return true to add the match into the result
   * @return {Array}
   */
  getRegexResults(regex, str, onMatch) {
    let m, list = [];
    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      if (!onMatch || onMatch(m, regex))
        list.push(m);
    }
    return list;
  },

  writeToFile(file, content) {
    file = path.resolve(file);
    fs.writeFileSync(file, content);
  },

  /**
   * // Default, make directories relative to current working directory.
   * mkDirByPathSync('path/to/dir');
   *
   * // Make directories relative to the current script.
   * mkDirByPathSync('path/to/dir', {isRelativeToScript: true});
   *
   * // Make directories with an absolute path.
   * mkDirByPathSync('/path/to/dir');
   *
   * @param targetDir
   * @param isRelativeToScript
   */
  createFolders(targetDir, {isRelativeToScript = false} = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    if (!fs.existsSync(targetDir)) {
      targetDir.split(/[\\\/]/g).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
          if (!fs.existsSync(curDir)) {
            fs.mkdirSync(curDir);
            //console.log(`Directory ${curDir} created!`);
          }
        } catch (err) {
          if (err.code !== 'EEXIST') {
            throw err;
          }
          //console.log(`Directory ${curDir} already exists!`);
        }

        return curDir;
      }, initDir);
    }
  },

  appendToFile(file, content) {
    fs.appendFileSync(file, content);
  },

  getFileContent(file) {
    return fs.readFileSync(file, 'utf8');
  },


  getBuildNumber() {
    let date = new Date(),
      day = date.getDate(),
      month = date.getMonth() + 1,
      hour = date.getHours(),
      minute = date.getMinutes();
    if (day < 10) day = '0' + day;
    if (month < 10) month = '0' + month;
    if (hour < 10) hour = '0' + hour;
    if (minute < 10) minute = '0' + minute;
    return '' + date.getFullYear() + month + day + hour + minute;
  },

  /**
   * @param {Array<string>} supportedExtensionList fomat: ['.js', '.scss']
   * @param {string} file
   * @returns {boolean}
   */
  isSupportedFileExtension(supportedExtensionList, file) {
    return supportedExtensionList.indexOf(Utils.breakFullPathFile(file).extension) !== -1;
  },

  resolveFile(matchedfile, basedir) {
    try {
      return resolve.sync(matchedfile, {basedir: basedir});
    } catch (e) {
    }
    try {
      return Utils.tryResolveJsFile(matchedfile, basedir);
    } catch (e) {
      return Utils.tryResolveScssFile(matchedfile, basedir);
    }
  },

  tryResolveJsFile(matchedfile, basedir) {
    let file = basedir + matchedfile;
    let extension = path.extname(matchedfile);
    if (extension.length === 0) file += '.js';
    try {
      file = fs.realpathSync(file);
    } catch (e) {
      file = resolve.sync(file, {basedir: basedir});
    }
    return file;
  },

  tryResolveScssFile(matchedfile, basedir) {
    let file = basedir + matchedfile;
    let extension = path.extname(matchedfile);
    if (extension.length === 0) file += '.scss';
    try {
      file = fs.realpathSync(file);
      return file;
    } catch (e) {
    }
    try {
      return resolve.sync(file, {basedir: basedir});
    } catch (e) {
    }

    // resolve scss file begining with underscore
    let fileparts = path.parse(file);
    file = fileparts.dir + '/_' + fileparts.name + '.scss';
    try {
      file = fs.realpathSync(file);
      return file;
    } catch (e) {
      return resolve.sync(file, {basedir: basedir});
    }
  },

  tryResolvePath(path, supportedFileExtentions) {
    try {
      matchedFile = fs.realpathSync(matchedFile + supportedFileExtentions[k]);
      return matchedFile;
    } catch (e) {
      try { // to resolve scss file begining with underscore
        let fileBreak = Utils.breakFullPathFile(matchedFile);
        matchedFile = fs.realpathSync(fileBreak.path
          + "_" + fileBreak.fileName + supportedFileExtentions[k]);
        return matchedFile;
      } catch (e) {
      }
    }
    return false;
  },

  resolveRelative(file, basedir) {
    let k, parentFolder = '';
    try {
      return resolve.sync(file, {basedir: basedir});
    } catch (e) {
      try {
        let fileBreak = Utils.breakFullPathFile(file);
        return resolve.sync(fileBreak.path
          + "_" + fileBreak.fileName, {basedir: basedir});
      } catch (e) {
      }
    }
    for (k = 0; k < 6; k++) {
      let unresolvedFile = basedir + parentFolder + file;
      parentFolder += '../';
      try {
        return fs.realpathSync(unresolvedFile);
      } catch (e) {
      }
    }
    return false;
  },


  /**
   * Break filepath into 3 parts: path, fileName and extension
   * This function support backslash and slash separator
   *
   * @param fullPathFile
   * @returns {{path: string, fileName: string, extension: string}}
   */
  breakFullPathFile(fullPathFile) {
    let n, N = fullPathFile.length;
    let indexDot=N;
    for(n=N-1; n>=0; n--) {
      if(fullPathFile[n]==='.') {
        indexDot = n;
        break;
      }
    }
    for(;n>=0; n--) {
      if(fullPathFile[n]==='\\' || fullPathFile[n]==='/') {
        break;
      }
    }
    return {
      path: fullPathFile.substr(0, n+1),
      fileName: fullPathFile.substr(n+1, indexDot-n-1),
      extension: fullPathFile.substr(indexDot, N-indexDot),
      file: fullPathFile
    }
  },

  /**
   * @param object
   * @param {...} parentObjects
   */
  inherit(object, parentObjects) {
    for (let i = 1; i < arguments.length; i++) {
      if (arguments[i].prototype) {
        Utils.extend(object.prototype, arguments[i].prototype);
      } else {
        Utils.extend(object.prototype, arguments[i]);
      }
    }
    object.prototype.constructor = object;
  },

  /**
   * @param {object} object to extends with given properties
   * @param {object} properties
   * @return {object}
   */
  extend(object, properties) {
    properties = properties || {};
    for (let m in properties) {
      object[m] = properties[m];
    }
    return object;
  },


  isObject(val) {
    return val !== null && typeof val === 'object';
  },

  extendDeep(object, properties) {
    properties = properties || {};
    for (var m in properties) {
      if (Utils.isObject(properties[m])) {
        object[m] = object[m] || {};
        Utils.extendDeep(object[m], properties[m])
      } else {
        object[m] = properties[m];
      }
    }
    return object;
  },
};

module.exports = Utils;
