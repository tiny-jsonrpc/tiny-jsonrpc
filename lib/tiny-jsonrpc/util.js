;(function () {
var _define = typeof define === 'function' ? define : null;

// https://github.com/umdjs/umd/blob/master/nodeAdapter.js
if (typeof exports === 'object' && typeof _define !== 'function') {
    _define = function (factory) {
        module.exports = factory(require, exports, module);
    };
}

_define(function (require, exports, module) {
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

    return {
        defaults: defaults,
        merge: merge,
        clone: clone,
        toArray: toArray,
        isNumber: isNumber,
        isString: isString,
        isFunction: isFunction,
        isArray: isArray,
        isObject: isObject,
        isNull: isNull,
        isUndefined: isUndefined
    };
});

}());
