;(function (factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(
            require('./tiny-jsonrpc/server'),
            require('./tiny-jsonrpc/stream-server'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['./tiny-jsonrpc/server', './tiny-jsonrpc/stream-server'], factory);
    }
}(function (Server, StreamServer) {
    return {
        Server: Server,
        StreamServer: StreamServer
    };
}));
