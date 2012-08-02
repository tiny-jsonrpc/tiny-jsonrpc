var JSONRPCServer = require('../lib/tiny-jsonrpc');

describe('JSONRPCServer', function () {
    describe('constructor', function () {
    });

    describe('instances', function () {
        it('provide a listen method', function () {
            var server = new JSONRPCServer();
            expect(server.listen instanceof Function).toBe(true);
        });

        it('provide a provide method', function () {
            var server = new JSONRPCServer();
            expect(server.provide instanceof Function).toBe(true);
        });

        it('provide a revoke method', function () {
            var server = new JSONRPCServer();
            expect(server.revoke instanceof Function).toBe(true);
        });

        it('provide a provides method', function () {
            var server = new JSONRPCServer();
            expect(server.provides instanceof Function).toBe(true);
        });
    });
});
