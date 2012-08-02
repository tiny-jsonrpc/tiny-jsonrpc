var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;

describe('StreamServer', function () {
    describe('constructor', function () {
    });

    describe('instances', function () {
        it('provide a listen method', function () {
            var server = new StreamServer();
            expect(server.listen instanceof Function).toBe(true);
        });

        it('provide a provide method', function () {
            var server = new StreamServer();
            expect(server.provide instanceof Function).toBe(true);
        });

        it('provide a revoke method', function () {
            var server = new StreamServer();
            expect(server.revoke instanceof Function).toBe(true);
        });

        it('provide a provides method', function () {
            var server = new StreamServer();
            expect(server.provides instanceof Function).toBe(true);
        });
    });
});
