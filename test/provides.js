var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;
var MockStream = require('./util/mock-stream');
var expect = require('expect.js');

describe('StreamServer.provides', function () {
    it('returns true if the server provides the passed method', function () {
        var stream = new MockStream();
        var server = new StreamServer();

        server.provide(function foo() {});

        expect(server.provides('foo')).to.be(true);
    });

    it('returns false if the server does not provide the passed method',
        function () {
            var stream = new MockStream();
            var server = new StreamServer();

            expect(server.provides('fiz')).to.be(false);

            server.provide(function foo() {});

            expect(server.provides('frob')).to.be(false);
        });

    it('returns all methods the server provides if called without arguments',
        function () {
            var stream = new MockStream();
            var server = new StreamServer();

            server.provide(function foo() {},
                function fiz() {},
                function frob() {});

            expect(server.provides()).to.eql(['foo', 'fiz', 'frob']);
        });
});
