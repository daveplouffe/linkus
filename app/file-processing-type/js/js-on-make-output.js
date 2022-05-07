const eventbus = require('../../helpers/eventbus');
const OutputMaker = require('../../core/output-maker');
const LinkusEvent = require('../../core/linkus-event');

eventbus.on(LinkusEvent.onMakeOutput, onMakeOutput);

function onMakeOutput(linkus) {
  if (linkus.context.entry.extension === '.js' && linkus.context.state !== 'NO_CHANGE') {
    let outputMaker = OutputMaker.create();
    outputMaker.makeOutput({
      linkus,
      dependencyOrder: linkus.context.dependencyOrder,
      output: linkus.context.output
    });
    linkus.cached.saveDependencies(linkus.context.dependencyOrder);
  }
}