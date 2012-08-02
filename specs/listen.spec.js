var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;
var EventEmitter = require('events').EventEmitter;

describe('StreamServer.listen', function () {
    it('listens to a stream for data events', function () {
        var stream = new EventEmitter();
        var server = new StreamServer();

        stream.write = jasmine.createSpy();

        server.provide(function marco() { return 'polo'; });
        server.listen(stream);
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'marco'
        }));

        expect(stream.write).toHaveBeenCalled();
        expect(stream.write.mostRecentCall.args[0]).toBe(JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: 'polo'
        }));
    });

    it('respects backoff signals when writing', function () {
        var stream = new EventEmitter();
        var server = new StreamServer();

        stream.write = jasmine.createSpy().andReturn(false);

        server.provide(function marco() { return 'polo'; });
        server.listen(stream);
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'marco'
        }));

        expect(stream.write).toHaveBeenCalled();
        expect(stream.write.mostRecentCall.args[0]).toBe(JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: 'polo'
        }));
        stream.write.reset();

        stream.foobar = true;
        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'marco'
        }));

        stream.emit('data', JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'marco'
        }));

        expect(stream.write).not.toHaveBeenCalled();

        stream.write = jasmine.createSpy().andReturn(true);
        stream.emit('drain');

        expect(stream.write).toHaveBeenCalled();
        expect(stream.write.callCount).toBe(2);

        expect(stream.write.argsForCall[0][0]).toBe(JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: 'polo'
        }));

        expect(stream.write.argsForCall[1][0]).toBe(JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: 'polo'
        }));
    });
});
