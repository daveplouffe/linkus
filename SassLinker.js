const FileVersioner = require('./app/helpers/FileVersioner');
const Utils = require('./app/helpers/utils');
const path = require('path');
const {execSync} = require('child_process');

/**
 * @param options.nbOfOldVersions
 * @param {{entry, output, regexVersioning, regexRemoving}} options.builds
 */
let SassLinker = function(options) {

  let fileVersioner;
  let context;

  function execute() {
    console.log('SassLinker start on', new Date().toLocaleString());
    let startTime = process.hrtime();
    options.builds.forEach(function(build) {
      fileVersioner = new FileVersioner(path.dirname(build.output));
      context = build;
      console.log(' - linking \x1b[35m' + path.basename(build.entry) + '\x1b[0m');
      executeSass(build.entry, build.output);
      applyVersioning().then(removeOldBuilds);
    });
    console.log('build timelasp:', Utils.getTimeDiffInSeconds(startTime), 'seconds');
  }

  function executeSass(inputScss, outputfile) {
    execSync("sass --style=compressed " + inputScss + ':' + outputfile );
  }

  function applyVersioning() {
    return fileVersioner.applyVersion(context.regexVersioning);
  }

  function removeOldBuilds() {
    fileVersioner.remove(context.regexRemoving, options.nbOfOldVersions);
  }

  return {
    execute
  }
};

module.exports = SassLinker;