let commands = {
  consoleRemover: require('../commands/console-remover'),
  jsInclude: require('../commands/linkus-js-include'),
  includeCssIntoJs: require('../commands/linkus-inlucde-css-into-js'),
  htAccessLoader: require('../commands/htaccess-loader'),
  copyFileLoader: require('../commands/copy-file-loader'),
  buildRemover: require('../commands/builds-remover-command'),
  cacheFile: require('../commands/cache-file-command')
};

let defaultPlugins = function () {

  function append(props) {
    appendOnOutputDonePlugins(props);
    appendOnBeforWriteContentToOutputPlugins(props);
  }

  function appendOnOutputDonePlugins(props) {
    props.plugins.onOutputDone.unshift(commands.includeCssIntoJs);
  }

  function appendOnBeforWriteContentToOutputPlugins(props) {
    if (props.removeConsole) {
      props.plugins.onBeforeWriteContentToOutput.unshift(commands.consoleRemover);
    }
    props.plugins.onBeforeWriteContentToOutput.unshift(commands.jsInclude);
    //props.plugins.onBeforeWriteContentToOutput.unshift(commands.htAccessLoader);
    //props.plugins.onBeforeWriteContentToOutput.unshift(commands.copyFileLoader);
    //props.plugins.onBeforeWriteContentToOutput.push(commands.cacheFile); // must be last
    props.plugins.onLinkingDone.push(commands.buildRemover);
  }

  return {
    append
  }
};

module.exports = defaultPlugins();