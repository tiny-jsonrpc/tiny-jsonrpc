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

    function JSONRPCServer (options) {
        this.options = options = clone(defaults(options || {}, defaultConfig));

        this._methods = {};
        this._streams = [];
    }

    JSONRPCServer.prototype.errors = {
        PARSE_ERROR: -32700,
        INVALID_REQUEST: -32600,
        METHOD_NOT_FOUND: -32601,
        INVALID_PARAMS: -32602,
        INTERNAL_ERROR: -32603
    };

    // TODO: real error messages here
    JSONRPCServer.prototype.errorMessages = (function () {
        var msgs = {};
        var errs = JSONRPCServer.prototype.errors;
        for (var k in errs) {
            msgs[errs[k]] = k;
        }
        return msgs;
    }());

    /*
     * listen (stream)
     * provide (method || object)
     * provides (methodName)
     * unprovide (methodName)
     */

    JSONRPCServer.prototype.listen = function () {
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

    JSONRPCServer.prototype._onData = function (stream, request) {
        var result = this._handleRequest(stream, request);

        this._write(stream, result);
    };

    JSONRPCServer.prototype._onDrain = function (stream, request) {
        var buffer = stream.buffer.slice().reverse();

        stream.full = false;
        while (buffer.length > 0) {
            this._write(stream, buffer.pop());
        }
    };

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

    JSONRPCServer.prototype._provide = function (toProvide, fn, name) {
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

    JSONRPCServer.prototype.provide = function () {
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

    JSONRPCServer.prototype.revoke = function (stream) {
        throw 'Not implemented';
    };

    JSONRPCServer.prototype.provides = function (method) {
        return this._methods.hasOwnProperty(method);
    };

    function isNumber(x) { return typeof x === 'number'; }
    function isString(x) { return typeof x === 'string'; }
    function isFunction(x) { return typeof x === 'function'; }
    function isArray(x) { return x instanceof Array; }
    function isObject(x) { return typeof x === 'object'; }
    function isNull(x) { return x === null; }
    function isUndefined(x) { return x === void undefined; }

    JSONRPCServer.prototype._error = function(id, message, code, data) {
        var error;

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

        return error;
    };

    JSONRPCServer.prototype._response = function (id, result) {
        var response = {
            jsonrpc: '2.0',
            id: id,
            result: result
        };

        return response;
    };

    JSONRPCServer.prototype._write = function (stream, what) {
        var success

        if (stream.stream.foobar) {
            debugger;
        }

        if (stream.full) {
            stream.buffer.push(what);
        } else {
            stream.full = !stream.stream.write(JSON.stringify(what));
        }
    };

    function notEmpty(x) {
        return !isUndefined(x) && !isNull(x);
    }

    JSONRPCServer.prototype._handleRequest = function (stream, request) {
        // parse the payload
        try {
            request = JSON.parse(request, this.options.reviver);
        } catch (e) {
            return this._error(null, this.errors.PARSE_ERROR, e);
        }

        // is it a batch request?
        // TODO: handle batched requests

        if (!isUndefined(request.id) &&
            !isNull(request.id) &&
            !isString(request.id) &&
            !isNumber(request.id)
        ) {
            return this._error(null, this.errors.INVALID_REQUEST);
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
            return this._error(request.id, this.errors.INVALID_REQUEST);
        }

        // else, handle the request
        var method = this._methods[request.method];
        if (!method) {
            return this._error(request.id, this.errors.METHOD_NOT_FOUND);
        }

        try {
            return this._response(request.id, method.fn());
        } catch (e) {
            return this._error(request.id, this.errors.INTERNAL_ERROR, e);
        }
    };

    return JSONRPCServer;
});

}());
