const EventEmitter = require('events');

class Eventbus extends EventEmitter {
}

const eventbus = new Eventbus();

module.exports = eventbus;