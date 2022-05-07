const eventbus = require('../../helpers/eventbus');
const LinkusEvent = require('../app/linkus-event');

eventbus.on(LinkusEvent.onResolve, onResolve);

function onResolve(linkus) {
    if (linkus.context.entry.extension === '.html') {
      // todo
    }
  }


