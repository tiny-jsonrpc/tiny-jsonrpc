var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;
var MockStream = require('./util/mock-stream');

describe('StreamServer.provides', function () {
    it('returns true if the server provides the passed method', function () {
        var stream = new MockStream();
        var server = new StreamServer();

        server.provide(function foo() {});

        expect(server.provides('foo')).toBe(true);
    });

    it('returns false if the server does not provide the passed method', function () {
        var stream = new MockStream();
        var server = new StreamServer();

        expect(server.provides('fiz')).toBe(false);

        server.provide(function foo() {});

        expect(server.provides('frob')).toBe(false);
    });

    it('returns the names of all methods the server provides if called without arguments', function () {
        var stream = new MockStream();
        var server = new StreamServer();

        server.provide(function foo() {},
            function fiz() {},
            function frob() {});

        expect(server.provides()).toEqual(['foo', 'fiz', 'frob']);
    });
});
