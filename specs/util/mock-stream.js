var EventEmitter = require('events').EventEmitter;

function MockStream() { }

MockStream.prototype = new EventEmitter();
MockStream.prototype.constructor = MockStream;

MockStream.prototype.write = function () {};

module.exports = MockStream;
