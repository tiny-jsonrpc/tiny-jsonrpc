;(function () {
var _define = typeof define === 'function' ? define : null;

// https://github.com/umdjs/umd/blob/master/nodeAdapter.js
if (typeof exports === 'object' && typeof _define !== 'function') {
    _define = function (factory) {
        var foo = factory(require, exports, module);
        module.exports = foo;
    };
}

_define(function (require, exports, module) {
    var Server = require('./tiny-jsonrpc/server');
    var StreamServer = require('./tiny-jsonrpc/stream-server');

    return {
        Server: Server,
        StreamServer: StreamServer
    };
});

}());
