const path = require('path');
const resolve = require('resolve');
const Utils = require('./app/helpers/utils');
const eventbus = require('./app/helpers/eventbus');
const LinkusEvent = require('./app/core/linkus-event');
const propertyValidator = require('./app/core/propertyValidator');
const defaultPlugins = require('./app/core/defaultPlugins');
const FileWatcher = require('./app/core/FileWatcher');
const DependencyCached = require('./app/core/DependencyCached');

//region linkus process
require('./app/file-processing-type/js/js-on-resolve');
require('./app/helpers/linkus-auto-generated-clean');
//endregion

/**@typedef {function(path:string)} linkus_include */

let Linkus = function (props) {
  let that = this;
  that.props = {
    basedir: '',
    builds: [],
    oldBuildCount: 5,
    sourcemap: true,
    version: null,
    nocache: false,
    removeConsole: false,
    modularImport: false,
    fileMapping: {
      enabled: false,
      files: []
    },
    compile: {
      enabled: false,
      isDebugMode: false,
      compilationLevel: 'ADVANCED_OPTIMIZATIONS',
      process_common_js_modules: false,
      module_resolution: ''
    },
    plugins: {
      onBeforeBuild: [],
      onBeforeResolve: [],
      onResolveDone: [],
      onBeforeWriteContentToOutput: [],
      onOutputDone: [],
      onBeforeCompile: [],
      onCompileDone: [],
      onLinkingDone: [],
      onBuildDone: []
    }
  };
  that.props = Utils.extendDeep(that.props, props);
  that.context = {
    entry: null,
    output: null,
  };
  that._startTime;
  propertyValidator.validate(that.props);
  //startWatch(that);
  defaultPlugins.append(that.props);
};

Linkus.prototype.compile = function() {
  startLinking(this);
  return this;
};

/**
 * @param {{basedir: string, compile: {isDebugMode: boolean, enabled: number, compilationLevel: string}, sourcemap: boolean, builds: *[], nocache: boolean, php: {serverDocumentRoot: string}, oldBuildCount: number, isModular: boolean, fileMapping: {files: [{from: string, to: string}], enabled: number}, removeConsole: number}} props
 * @param {string} props.basedir
 * @param {number} props.oldBuildCount
 * @param {string} props.version
 * @param {bool} props.modularImport - false by default which mean all imports will be concatenated into 1 file
 * @param {Array<{entry, output}>} props.builds
 * @param {Array} props.builds
 * @param {{enabled: boolean, files: Array}} props.fileMapping
 * @param {string?} props.php.serverDocumentRoot
 * @param {string?} props.php.includePathPrepend - default to '.'
 * @param {boolean=} props.removeConsole
 * @param {{enabled, isDebugMode, compilationLevel}=} props.compile
 * @param {{enabled, paths, extensions}} props.watch
 * @param {object} props.plugins
 * @param {Array} props.plugins.onBeforeBuild
 * @param {Array} props.plugins.onResolveDone
 * @param {Array} props.plugins.onBeforeWriteContentToOutput
 * @param {Array} props.plugins.onOutputDone
 * @param {Array} props.plugins.onBeforeCompile
 * @param {Array} props.plugins.onCompileDone
 * @param {Array} props.plugins.onLinkingDone
 * @param {Array} props.plugins.onBuildDone
 * @returns {Linkus}
 */
Linkus.create = function (props) {
  return Linkus.make(props).compile();
};

Linkus.make = function (props) {
  return new Linkus(props);
};

require('./app/core/commandExecutor')();
module.exports = Linkus;

function startLinking(linkus) {
  if(linkus.props.version===null)
    linkus.props.version = Utils.getBuildNumber();

  console.log('');
  console.log('Linkus start on', new Date().toLocaleString());
  linkus.startTime = process.hrtime();
  eventbus.emit(LinkusEvent.onBeforeBuild, linkus);
  for (let index = 0; index < linkus.props.builds.length; index++) {
    let context = Utils.extend({}, linkus.props.builds[index]);
    context.startBuild = process.hrtime();
    context.output = normalizeOutput(context.output, linkus.props.basedir);
    context.entry = normalizeInput(context.entry, linkus.props.basedir);
    context.outputParts = Utils.breakFullPathFile(context.output);
    context.outputParts.fileNameWithVersion = context.outputParts.fileName + (linkus.props.version ? '.' + linkus.props.version:'');
    context.output = context.outputParts.path + context.outputParts.fileNameWithVersion + context.outputParts.extension;
    context.outputParts.file = context.output;
    context.version = linkus.props.version;
    linkus.context = context;
    linkus.cached = new DependencyCached(linkus);
    eventbus.emit(LinkusEvent.onBeforeResolve, linkus);
    eventbus.emit(LinkusEvent.onResolve, linkus);
    eventbus.emit(LinkusEvent.onResolveDone, linkus);
    eventbus.emit(LinkusEvent.onMakeOutput, linkus);
    eventbus.emit(LinkusEvent.onOutputDone, linkus);
    if (linkus.props.compile.enabled) {
      eventbus.emit(LinkusEvent.onBeforeCompile, linkus);
      eventbus.emit(LinkusEvent.onCompile, linkus);
      eventbus.emit(LinkusEvent.onCompileDone, linkus);
    }
    eventbus.emit(LinkusEvent.onLinkingDone, linkus)
  }
  eventbus.emit(LinkusEvent.onBuildDone, linkus);
}

function normalizeInput(input, basedir) {
  if (input.indexOf(':') === -1) {
    input = resolve.sync(input, {basedir});
  }
  return Utils.breakFullPathFile(input);
}

function normalizeOutput(output, basedir) {
  if (output.indexOf(':') === -1) {
    output = path.normalize(basedir + '\\' + output);
  }
  return output;
}

/* console
Colors reference

Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"
 */