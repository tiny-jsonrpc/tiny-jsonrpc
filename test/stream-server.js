var StreamServer = require('../lib/tiny-jsonrpc').StreamServer;
var Server = require('../lib/tiny-jsonrpc').Server;
var expect = require('expect.js');

describe('StreamServer instances', function () {
    it('are instances of Server', function () {
        expect(new StreamServer()).to.be.a(Server);
    });

    it('provide a listen method', function () {
        var server = new StreamServer();
        expect(server.listen instanceof Function).to.be(true);
    });
});
