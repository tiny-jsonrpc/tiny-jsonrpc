var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;
var MockStream = require('./util/mock-stream');

describe('StreamServer.provide', function () {
    it('registers functions as JSON-RPC methods if named', function () {
        var stream = new MockStream();
        var server = new StreamServer();
        var called = {};

        server.provide(function foo() { called.foo = true; });
        server.listen(stream);
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'foo'
        }));

        expect(called.foo).toBe(true);

        server.provide(
            function fiz() { called.fiz = true; },
            function frob() { called.frob = true; });

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'fiz'
        }));

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'frob'
        }));

        expect(called.fiz).toBe(true);
        expect(called.frob).toBe(true);
    });

    it('throws if passed an anonymous function', function () {
        var server = new StreamServer();

        expect(function () { server.provide(function () { }) }).toThrow();
        expect(function () { server.provide(function foo() {}, function () { }) }).toThrow();
    });

    it('registers methods of objects as JSON-RPC methods', function () {
        var stream = new MockStream();
        var server = new StreamServer();
        var called = {};

        server.provide({ foo: function () { called.foo = true; } });
        server.listen(stream);
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'foo'
        }));

        expect(called.foo).toBe(true);

        server.provide({
            fiz: function () { called.fiz = true; },
            wiz: function () { called.wiz = true; }
        }, {
            frob: function () { called.frob = true; }
        });

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'fiz'
        }));

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'wiz'
        }));

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 4,
            method: 'frob'
        }));

        expect(called.fiz).toBe(true);
        expect(called.wiz).toBe(true);
        expect(called.frob).toBe(true);
    });

    it('allows functions and objects in the same call', function () {
        var stream = new MockStream();
        var server = new StreamServer();
        var called = {};

        server.provide({
            foo: function () { called.foo = true; }
        }, function fiz() { called.fiz = true; });

        server.listen(stream);
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'foo'
        }));

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'fiz'
        }));

        expect(called.foo).toBe(true);
        expect(called.fiz).toBe(true);
    });

    it('throws when passed a duplicate name', function () {
        var server = new StreamServer();
        function fn1() {};
        function fn2() {};

        expect(function () { server.provide(function foo() { }, function foo() { }) }).toThrow();
        expect(function () { server.provide({ foo: fn1 }, { foo: fn2 }) }).toThrow();
        expect(function () { server.provide({ foo: fn1 }, function foo() {}) }).toThrow();

        server.provide(function foo() {});
        expect(function () { server.provide(function foo() { }) }).toThrow();
        expect(function () { server.provide({ foo: fn1 }) }).toThrow();
    });

    it('registers no methods if any cause it to throw', function () {
        var stream = new MockStream();
        var server = new StreamServer();
        var called = {};

        try {
            server.provide(function foo() { called.foo = true; }, function () {});
        } catch (e) {}

        server.listen(stream);
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'foo'
        }));

        expect(called.foo).not.toBe(true);
    });

    it('marshals named arguments', function () {
        var stream = new MockStream();
        var server = new StreamServer();
        var called = false;

        server.provide(function foo(bar, baz) {
            expect(bar).toBe(void undefined);
            expect(baz).toBe(23);
            called = true;
        });

        server.listen(stream);
        stream.foobar = true;
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'foo',
            params: {
                baz: 23,
                biz: 42
            }
        }));

        expect(called).toBe(true);
    });
});
