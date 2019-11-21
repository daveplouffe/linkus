const Utils = require('./app/helpers/utils');
const path = require('path');
const fs = require('fs');
const sass = require('sass');
const FileVersioner = require('./app/helpers/FileVersioner');

/**
 * @param options.nbOfOldVersions
 * @param {{entry, output, regexVersioning, regexRemoving}} options.builds
 */
let SassLinker = function(options) {

  let version = '.'+Utils.getBuildNumber();

  function execute() {
    console.log('SassLinker start on', new Date().toLocaleString());
    let startTime = process.hrtime();
    options.builds.forEach(compile);
    console.log('build timelasp:', Utils.getTimeDiffInSeconds(startTime), 'seconds');
  }

  async function compile(build) {
    return new Promise(function (resolve) {
      if(isFileExist(build.entry)) {
        console.log(' - linking \x1b[35m' + path.basename(build.entry) + '\x1b[0m');
        build.output = path.parse(build.output);
        build.outfile = build.output.dir + build.output.name + version + build.output.ext;
        executeSass(build);
        removeOldBuild(build);
      }
      resolve();
    });
  }

  function isFileExist(file) {
    if(!fs.existsSync(file)) {
      console.error(" - ERROR "+path.basename(file)+" -> file not found");
      return false;
    }
    return true;
  }

  function executeSass(build) {
    var result = sass.renderSync({
      file: build.entry,
      outputStyle: 'compressed',
      outFile: build.outfile,
      sourceMap: true
    });
    fs.writeFileSync(build.outfile, result.css, 'utf8');
    fs.writeFileSync(build.outfile+'.map', result.map, 'utf8');
  }

  function removeOldBuild(build) {
    let fileVersioner = new FileVersioner(build.output.dir);
    let regex = new RegExp(build.output.name+'.*'+build.output.ext);
    fileVersioner.remove(regex, options.nbOfOldVersions);
  }

  return {
    execute
  }
};

module.exports = SassLinker;