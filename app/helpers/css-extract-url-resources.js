/**
 * cssUrlRenamer finds url in css file, change name of url for
 * an hash number and create a file into the output folder with
 * the hash number.
 *
 * So it imports url resources from css file to output folder
 */


var crypto = require('crypto');
const fs = require('fs');
const Utils = require('./utils');

let cssExtractUrlResources = {
  hasherAlgorithm: 'sha1',
  ressourceFolder: 'res/',

  /**
   * @param {{file, basedir}} args
   */
  execute(args) {
    const regex = /url[\s]*\((?!"data)"([\s\S]*?)"\)|url\((?!"data)(?!https?:\/\/)(?!#)(.*?)\)|local[\s]*\((?!"data)"([\s\S]*?)"\)/ig;
    let content = fs.readFileSync(args.file, 'utf8');
    let output = Utils.breakFullPathFile(args.file);
    let offset = 0;
    Utils.createFolders(output.path + cssExtractUrlResources.ressourceFolder);
    Utils.getRegexResults(regex, content, function (m, regex) {
      let tmp;
      let url = m[1] || m[2] || m[3];

      //stripout parameters after question mark
      let questionMarkIndex = url.indexOf('?');
      if (questionMarkIndex !== -1) {
        url = url.substring(0, questionMarkIndex);
      } else {
        questionMarkIndex = url.indexOf('#');
        if (questionMarkIndex !== -1)
          url = url.substring(0, questionMarkIndex);
      }

      tmp = Utils.resolveRelative(url, args.basedir);
      if (!tmp) {
        if (Utils.breakFullPathFile(url).extension !== '') {
          console.error('\nError raised by css-extract-url-resources.js');
          console.error('Error found in ' + args.file);
          console.error('File not found: ' + url);
        }
        return;
      }
      url = tmp;

      try {
        let urlextract = Utils.breakFullPathFile(url);
        let urlHash = crypto.createHash(cssExtractUrlResources.hasherAlgorithm)
          .update(fs.readFileSync(url, 'utf8')).digest('hex');
        fs.copyFileSync(url, output.path + cssExtractUrlResources.ressourceFolder + urlHash + urlextract.extension);

        let newCss = 'url("' + cssExtractUrlResources.ressourceFolder + urlHash + urlextract.extension + '")';

        content = content.substring(0, m.index + offset)
          + newCss
          + content.substring(m.index + m[0].length + offset);

        offset -= m[0].length - newCss.length;

        //regex.lastIndex = m.index+newCss.length-1;

      } catch (err) {
        console.error(err);
      }
    });

    fs.writeFileSync(args.file, content);
  }
};

module.exports = cssExtractUrlResources;