const eventbus = require('../helpers/eventbus');
const LinkusEvent = require('./linkus-event');
const Utils = require('../helpers/utils');

let commandExecutor = function () {

  eventbus.on(LinkusEvent.onBeforeBuild, onBeforeBuild);
  eventbus.on(LinkusEvent.onBeforeResolve, onBeforeResolve);
  eventbus.on(LinkusEvent.onResolveDone, onResolveDone);
  eventbus.on(LinkusEvent.onBeforeWriteContentToOutput, onBeforeWriteContentToOutput);
  eventbus.on(LinkusEvent.onOutputDone, onOutputDone);
  eventbus.on(LinkusEvent.onBeforeCompile, onBeforeCompile);
  eventbus.on(LinkusEvent.onCompileDone, onCompileDone);
  eventbus.on(LinkusEvent.onBuildDone, onBuildDone);

  function onBeforeBuild(linkus) {
    executeCommands(linkus, linkus.props.plugins.onBeforeBuild);
  }

  function onBeforeResolve(linkus) {
    executeCommands(linkus, linkus.props.plugins.onBeforeResolve);
  }

  function onResolveDone(linkus) {
    executeCommands(linkus, linkus.props.plugins.onResolveDone);
  }

  function onBeforeWriteContentToOutput(linkus) {
    executeCommands(linkus, linkus.props.plugins.onBeforeWriteContentToOutput);
  }

  function onOutputDone(linkus) {
    executeCommands(linkus, linkus.props.plugins.onOutputDone);
  }

  function onBeforeCompile(linkus) {
    executeCommands(linkus, linkus.props.plugins.onBeforeCompile);
  }

  function onCompileDone(linkus) {
    executeCommands(linkus, linkus.props.plugins.onCompileDone);
    console.log('\x1b[32m%s\x1b[0m', linkus.context.entry.fileName + linkus.context.entry.extension + " is build"
      + ' (' + Utils.getTimeDiffInSeconds(linkus.context.startBuild) + ' seconds)');
  }

  function onBuildDone(linkus) {
    executeCommands(linkus, linkus.props.plugins.onBuildDone);
    console.log('\nbuild timelasp:', Utils.getTimeDiffInSeconds(linkus.startTime), 'seconds');

    if (linkus.props.enabled === false
      && linkus.context.entry === linkus.props.builds[linkus.props.builds.length - 1].entry) {
      console.log(linkus.props.enabled);
      process.exit();
    }
  }

  function executeCommands(linkus, commands) {
    commands.forEach(function (command) {
      command.execute(linkus);
    })
  }

};

module.exports = commandExecutor;