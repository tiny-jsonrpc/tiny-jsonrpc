;(function () {

// https://github.com/umdjs/umd/blob/master/nodeAdapter.js
if (typeof exports === 'object' && typeof define !== 'function') {
    define = function (factory) {
        module.exports = factory(require, exports, module);
    };
}

define(function (require, exports, module) {
    var defaultConfig = {};

    function defaults(a, b) {
        for (var key in b) {
            if (!a.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }

        return a;
    }

    function merge(a, b) {
        for (var key in b) {
            a[key] = b[key];
        }

        return a;
    }

    function clone(o) {
        return defaults({}, o);
    }

    function toArray(x) {
        return Array.prototype.slice.call(x);
    }

    function isNumber(x) { return typeof x === 'number'; }
    function isString(x) { return typeof x === 'string'; }
    function isFunction(x) { return typeof x === 'function'; }
    function isArray(x) { return x instanceof Array; }
    function isObject(x) { return typeof x === 'object'; }
    function isNull(x) { return x === null; }
    function isUndefined(x) { return x === void undefined; }

    function Server(options) {
        this.options = options = clone(defaults(options || {}, defaultConfig));

        this._methods = {};
    }

    Server.prototype.errors = {
        PARSE_ERROR: -32700,
        INVALID_REQUEST: -32600,
        METHOD_NOT_FOUND: -32601,
        INVALID_PARAMS: -32602,
        INTERNAL_ERROR: -32603
    };

    // TODO: real error messages here
    Server.prototype.errorMessages = (function () {
        var msgs = {};
        var errs = Server.prototype.errors;
        for (var k in errs) {
            msgs[errs[k]] = k;
        }
        return msgs;
    }());

    function parseArgs(args) {
        args = args.split(/,\s*/);
        var result = {};

        for (var i = 0; i < args.length; i++) {
            result[args[i]] = i;
        }

        return result;
    }

    function functionSnippet(fn) {
        return fn.toString().slice(0, 20) + '...';
    }

    function parseFunction(fn) {
        var parsed = fn.toString().match(/function\s+(\w+)?\((.*)\)/);

        if (!parsed) {
            throw 'Cannot parse function: ' + functionSnippet(fn);
        }

        return {
            fn: fn,
            name: parsed[1],
            args: parseArgs(parsed[2])
        };
    }

    Server.prototype._provide = function (toProvide, fn, name) {
        var fnRecord = parseFunction(fn);

        fnRecord.name = name || fnRecord.name;

        if (!fnRecord.name) {
            throw 'Cannot provide anonymous function: ' + functionSnippet(fn);
        }

        if (this._methods[fnRecord.name] || toProvide[fnRecord.name]) {
            throw 'Cannot provide duplicate function ' + fnRecord.name;
        }

        toProvide[fnRecord.name] = fnRecord;
    };

    Server.prototype.provide = function () {
        var args = toArray(arguments);
        var toProvide = {};
        var method;

        args.forEach(function (x) {
            if (isFunction(x)) {
                method = this._provide(toProvide, x);
            } else if (isObject(x)) {
                for (var k in x) {
                    if (isFunction(x[k])) {
                        this._provide(toProvide, x[k], k);
                    }
                }
            } else {
                throw 'Cannot provide illegal argument: ' + x;
            }
        }, this);

        merge(this._methods, toProvide);
    };

    Server.prototype.revoke = function () {
        var args = toArray(arguments);

        for (var i = 0; i < args.length; i++) {
            delete this._methods[args[i]];
        }
    };

    function keys(o) {
        if (Object.prototype.keys) {
            return o.keys();
        }

        var result = [];
        for (var k in o) {
            if (o.hasOwnProperty(k)) {
                result.push(k);
            }
        }

        return result;
    }

    Server.prototype.provides = function (method) {
        if (isUndefined(method)) {
            return keys(this._methods);
        }

        return this._methods.hasOwnProperty(method);
    };

    Server.prototype.makeError = function(id, message, code, data) {
        var error;
        var response;

        if (isNumber(message)) {
            data = code;
            code = message;
            message = this.errorMessages[code];
        }

        if (!isNumber(code)) {
            code = this.errors.INTERNAL_ERROR;
        }

        error = { id: id, code: code, message: message };

        if (!isUndefined(data)) {
            error.data = data;
        }

        if (isNumber(id) || isString(id) || id === null) {
            response = {
                jsonrpc: '2.0',
                id: id
            };
            response.error = error;
            return response;
        } else {
            response = new Error(message);
            response.code = code;

            if (!isUndefined(data)) {
                response.data = data;
            }

            return response;
        }
    };

    Server.prototype.makeResponse = function (id, result) {
        var response = {
            jsonrpc: '2.0',
            id: id,
            result: result
        };

        return isString(id) || isNumber(id) || id === null ? response : null;
    };

    /**
     * Transform named arguments to an args array
     *
     * Missing args are undefined.
     */
    function marshal(params, method) {
        var result = [];

        if (isArray(params)) {
            result = params;
        } else if (params) {
            for (var k in params) {
                if (isNumber(method.args[k])) {
                    result[method.args[k]] = params[k];
                }
            }
        }

        return result;
    }

    Server.prototype.respond = function (request) {
        var code, response, results;

        // parse the payload
        try {
            request = JSON.parse(request, this.options.reviver);
        } catch (e) {
            return JSON.stringify(
                this.makeError(null, this.errors.PARSE_ERROR, e));
        }

        // is it a batch request?
        if (isArray(request)) {
            if (request.length < 1) {
                // empty batch requests are invalid
                return JSON.stringify(
                    this.makeError(null, this.errors.INVALID_REQUEST));
            }

            results = [];
            for (var i = 0; i < request.length; i++) {
                response = this._respond(request[i]);

                if (response !== null && !(response instanceof Error)) {
                    // it's an actual response, send it
                    results.push(response);
                }
            }

            if (results.length < 1) {
                // don't respond if everything was notifications
                results = null;
            }
        } else {
            results = this._respond(request);
        }

        return results !== null && !(results instanceof Error) ?
            JSON.stringify(results) : results;
    };

    Server.prototype._respond = function (request) {
        var code;

        if (!isUndefined(request.id) &&
            !isNull(request.id) &&
            !isString(request.id) &&
            !isNumber(request.id)
        ) {
            return this.makeError(null, this.errors.INVALID_REQUEST);
        }

        // is it a valid request?
        if (request.jsonrpc !== '2.0' ||
            !isString(request.method) ||
            (
                !isUndefined(request.params) &&
                !isArray(request.params) &&
                !isObject(request.params)
            )
        ) {
            return this.makeError(isUndefined(request.id) ? null : request.id,
                this.errors.INVALID_REQUEST);
        }

        // coolbro. handle it.
        var method = this._methods[request.method];
        if (!method) {
            return this.makeError(request.id, this.errors.METHOD_NOT_FOUND);
        }

        try {
            return this.makeResponse(request.id,
                method.fn.apply(null, marshal(request.params, method))
            );
        } catch (e) {
            code = isNumber(e.code) ? e.code : this.errors.INTERNAL_ERROR;

            return this.makeError(request.id, e.message || e, e.code, e.data);
        }
    };

    function StreamServer(options) {
        Server.apply(this, arguments);
        this._streams = [];
    }

    StreamServer.prototype = new Server();
    StreamServer.prototype.constructor = StreamServer;

    StreamServer.prototype._write = function (stream, what) {
        var success

        if (stream.full) {
            stream.buffer.push(what);
        } else {
            stream.full = !stream.stream.write(what);
        }
    };

    StreamServer.prototype.listen = function () {
        var args = toArray(arguments);

        args.forEach(function (stream) {
            var streamRecord = {
                stream: stream,
                buffer: []
            };

            streamRecord.onData = this._onData.bind(this, streamRecord);
            stream.on('data', streamRecord.onData);

            streamRecord.onDrain = this._onDrain.bind(this, streamRecord);
            stream.on('drain', streamRecord.onDrain);

            this._streams.push(streamRecord);
        }, this);
    };

    StreamServer.prototype._onData = function (stream, request) {
        var result = this.respond(request);

        this._write(stream, result);
    };

    StreamServer.prototype._onDrain = function (stream, request) {
        var buffer = stream.buffer.slice().reverse();

        stream.full = false;
        while (buffer.length > 0) {
            this._write(stream, buffer.pop());
        }
    };

    return {
        Server: Server,
        StreamServer: StreamServer
    };
});

}());
