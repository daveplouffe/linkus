const {'execSync': execSync} = require('child_process');

/**
 * @type {{exec: cliUtils.exec, truncate: cliUtils.truncate, getIpTables: cliUtils.getIpTables, getPublicIpAddress: cliUtils.getPublicIpAddress, cat: cliUtils.cat, copy(*, *, {isRecursive, copyfolderContent}): *, remove(*): *, makeDir(*): *, move(*, *): *}}
 */
let cliUtils = {

  exec: function (command) {
    return execSync(command);
  },

  /**
   * @param file
   * @param {number} size in byte, 0 by default
   */
  truncate: function (file, size) {
    size = size || 0;
    return execSync('truncate -s ' + size + ' ' + file);
  },

  getIpTables: function () {
    return execSync('sudo iptables -S').toString();
  },

  getPublicIpAddress: function () {
    return execSync('host myip.opendns.com resolver1.opendns.com | grep -oP "^myip\\.opendns\\.com.* \\K(\\d{1,3}\\.){3}(\\d{1,3})"').toString();
  },

  cat: function (file) {
    return execSync('cat ' + file).toString();
  },

  /**
   * @param src
   * @param dest
   * @param {{isRecursive, copyfolderContent}} options
   * @return {*}
   */
  copy(src, dest, options) {
    let opt = '', cpContent = '';
    options = options || {};
    if (options.isRecursive) opt += '-R ';
    if (options.copyfolderContent) cpContent = '\\.';
    //console.log('cp ' + opt + src + cpContent + ' ' + dest);
    return execSync('cp ' + opt + src + cpContent + ' ' + dest)
  },

  remove(file) {
    return execSync('rm ' + file)
  },

  makeDir(folderPath) {
    return execSync('mkdir ' + folderPath);
  },

  move(from, to) {
    return execSync('mv "' + from + '" "' + to + '"');
  }

};
module.exports = cliUtils;