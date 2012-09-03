var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;
var expect = require('expect.js');

describe('StreamServer', function () {
    describe('constructor', function () {
    });

    describe('instances', function () {
        it('provide a listen method', function () {
            var server = new StreamServer();
            expect(server.listen instanceof Function).to.be(true);
        });

        it('provide a provide method', function () {
            var server = new StreamServer();
            expect(server.provide instanceof Function).to.be(true);
        });

        it('provide a revoke method', function () {
            var server = new StreamServer();
            expect(server.revoke instanceof Function).to.be(true);
        });

        it('provide a provides method', function () {
            var server = new StreamServer();
            expect(server.provides instanceof Function).to.be(true);
        });
    });
});
