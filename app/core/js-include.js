const fs = require('fs');
const resolve = require('resolve');
const Utils = require('../helpers/utils');
const cliUtils = require('../helpers/cli-utils');
const path = require('path');

/**
 * This replace this statement in code:
 * <code>include('/path/to/something/to/include.extension');</code>
 *
 * The included path must be relative to the file entry and start
 * by a slash. When there is no slash, the path is treated like a
 * module file.
 *
 * Note: relative files starting by ".." or "." is not implemented
 *
 * @type {{execute: (function(file))}}
 */
let jsInclude = {
  regex: /\blinkus_include\b[\s]*\([\s]*(?:'|")(.*)(?:'|")[\s]*\)|\blinkus_import_copy\b[\s]*\([\s]*'(.*)'[\s]*\)[\s]*;?/gi,

  /**
   * @param {{file, content, basedir, linkus}} args
   * @return {string} modified content
   */
  execute(args) {
    let offset = 0;
    Utils.getRegexResults(jsInclude.regex, args.content, function (m) {
      if (m[1]) offset = doInclude(args, offset, m);
      else offset = doImportCopy(args, offset, m);
    });
    return args.content;
  }
};

function doInclude(args, offset, m) {
  let includeFile = resolveFile(m[1], args);
  try {
    let includeContent = fs.readFileSync(includeFile, 'utf8');
    if (Utils.breakFullPathFile(includeFile).extension !== '.js') {
      includeContent = includeContent.replace(/\s+/g, ' ');
      if (/\$\{.*\}/.test(includeContent)) {
        includeContent = '`' + includeContent.replace(/`/g, "\\`") + '`';
      } else {
        includeContent = '\'' + includeContent.replace(/'/g, "\\'") + '\'';
      }
    }
    args.content = args.content.substring(0, m.index + offset)
      + includeContent
      + args.content.substring(m.index + m[0].length + offset);
    offset += includeContent.length - m[0].length;
  } catch (err) {
    console.error(err);
  }
  return offset;
}

function resolveFile(file, args) {
  if (file[0] === '\\' || file[0] === '/') {
    file = args.basedir + file;
  } else {
    try {
      file = resolve.sync(file, {basedir: args.basedir});
    } catch (e) {
      console.error('\nError found in ' + args.file);
      console.error(e);
    }
  }
  return file;
}

function doImportCopy(args, offset, m) {
  let importCopy = resolveFile(m[2], args);
  try {
    let relativePath = Utils.getRelativePath(importCopy, args.linkus.context.output);
    let dest = path.normalize(path.dirname(args.linkus.context.output) + relativePath);
    Utils.createFolders(path.dirname(dest));
    cliUtils.copy(importCopy, dest);

    // efface la ligne
    args.content = args.content.substring(0, m.index + offset)
      + args.content.substring(m.index + m[0].length + offset);

    offset -= m[0].length;
  } catch (err) {
    console.error(err);
  }
  return offset;
}

module.exports = jsInclude;