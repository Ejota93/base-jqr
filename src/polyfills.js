/**
 * jQuery Reactive State Library - Polyfills
 * Polyfills para compatibilidad con navegadores antiguos
 * @version 1.0.0
 */

// Polyfill para Object.assign (IE11)
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Polyfill para Array.isArray (IE8)
if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

// Polyfill para Array.prototype.forEach (IE8)
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError('this is null or not defined');
        }
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            var kValue;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}

// Polyfill para Array.prototype.indexOf (IE8)
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (len === 0) {
            return -1;
        }
        var n = parseInt(fromIndex) || 0;
        var k;
        if (n >= 0) {
            k = n;
        } else {
            k = Math.max(0, len + n);
        }
        while (k < len) {
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

// Polyfill para Array.prototype.map (IE8)
if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) {
            throw new TypeError('this is null or not defined');
        }
        var O = Object(this);
        var len = parseInt(O.length) || 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }
        return A;
    };
}

// Polyfill para Array.prototype.filter (IE9)
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun/*, thisArg*/) {
        'use strict';
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = parseInt(t.length) || 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }
        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }
        return res;
    };
}

// Polyfill para Function.prototype.bind (IE8)
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function() {},
            fBound = function() {
                return fToBind.apply(this instanceof fNOP ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };
        if (this.prototype) {
            fNOP.prototype = this.prototype;
        }
        fBound.prototype = new fNOP();
        return fBound;
    };
}

// Polyfill para Object.keys (IE8)
if (!Object.keys) {
    Object.keys = function(obj) {
        var keys = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
}

// Polyfill para Object.create (IE8)
if (typeof Object.create !== 'function') {
    Object.create = function(proto, propertiesObject) {
        if (typeof proto !== 'object' && typeof proto !== 'function') {
            throw new TypeError('Object prototype may only be an Object: ' + proto);
        }
        if (proto === null) {
            throw new Error("This browser's implementation of Object.create is a shim and doesn't support 'null' as the first argument.");
        }
        function F() {}
        F.prototype = proto;
        return new F();
    };
}

// Polyfill para String.prototype.trim (IE8)
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

// Polyfill para Date.now (IE8)
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

// Polyfill para console.log (IE8)
if (typeof console === 'undefined') {
    window.console = {
        log: function() {},
        error: function() {},
        warn: function() {},
        info: function() {},
        debug: function() {}
    };
}

// Polyfill para addEventListener (IE8)
if (!window.addEventListener) {
    window.addEventListener = function(event, handler, capture) {
        window.attachEvent('on' + event, handler);
    };
    window.removeEventListener = function(event, handler, capture) {
        window.detachEvent('on' + event, handler);
    };
}

// Polyfill para CustomEvent (IE9)
(function() {
    if (typeof window.CustomEvent === 'function') return false;

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();

// Polyfill para Element.prototype.classList (IE9)
(function() {
    if (!('classList' in document.createElement('_'))) {
        
        function DOMTokenList(element) {
            this.element = element;
            var classes = element.className.trim().split(/\s+/);
            for (var i = 0; i < classes.length; i++) {
                if (classes[i]) {
                    this.push(classes[i]);
                }
            }
            this.updateClassName = function() {
                element.className = this.join(' ');
            };
        }
        
        DOMTokenList.prototype = [];
        
        DOMTokenList.prototype.add = function(token) {
            if (!this.contains(token)) {
                this.push(token);
                this.updateClassName();
            }
        };
        
        DOMTokenList.prototype.remove = function(token) {
            var index = this.indexOf(token);
            if (index !== -1) {
                this.splice(index, 1);
                this.updateClassName();
            }
        };
        
        DOMTokenList.prototype.toggle = function(token) {
            if (this.contains(token)) {
                this.remove(token);
                return false;
            } else {
                this.add(token);
                return true;
            }
        };
        
        DOMTokenList.prototype.contains = function(token) {
            return this.indexOf(token) !== -1;
        };
        
        DOMTokenList.prototype.replace = function(oldToken, newToken) {
            var index = this.indexOf(oldToken);
            if (index !== -1) {
                this.splice(index, 1, newToken);
                this.updateClassName();
            }
        };
        
        Object.defineProperty(Element.prototype, 'classList', {
            get: function() {
                if (!this._classList) {
                    this._classList = new DOMTokenList(this);
                }
                return this._classList;
            }
        });
    }
})();

// Polyfill para requestAnimationFrame (IE9)
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
})();

// Polyfill para Element.prototype.matches (IE9)
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}

// Polyfill para Element.prototype.closest (IE11)
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (Element.prototype.matches.call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

// Polyfill para Element.prototype.remove (IE11)
if (!Element.prototype.remove) {
    Element.prototype.remove = function() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

// Polyfill para String.prototype.startsWith (IE11)
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

// Polyfill para String.prototype.endsWith (IE11)
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

// Polyfill para Array.prototype.find (IE11)
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = parseInt(list.length) || 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// Polyfill para Promise (IE11)
(function(global) {
    if (typeof global.Promise === 'function') return;

    function Promise(executor) {
        var self = this;
        self.state = 'pending';
        self.value = undefined;
        self.reason = undefined;
        self.callbacks = [];

        function resolve(value) {
            if (self.state === 'pending') {
                self.state = 'fulfilled';
                self.value = value;
                self.callbacks.forEach(function(callback) {
                    callback.onFulfilled(value);
                });
            }
        }

        function reject(reason) {
            if (self.state === 'pending') {
                self.state = 'rejected';
                self.reason = reason;
                self.callbacks.forEach(function(callback) {
                    callback.onRejected(reason);
                });
            }
        }

        try {
            executor(resolve, reject);
        } catch (reason) {
            reject(reason);
        }
    }

    Promise.prototype.then = function(onFulfilled, onRejected) {
        var self = this;
        var promise2;

        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function(value) {
            return value;
        };
        onRejected = typeof onRejected === 'function' ? onRejected : function(reason) {
            throw reason;
        };

        if (self.state === 'fulfilled') {
            return promise2 = new Promise(function(resolve, reject) {
                try {
                    var x = onFulfilled(self.value);
                    resolve(x);
                } catch (reason) {
                    reject(reason);
                }
            });
        }

        if (self.state === 'rejected') {
            return promise2 = new Promise(function(resolve, reject) {
                try {
                    var x = onRejected(self.reason);
                    resolve(x);
                } catch (reason) {
                    reject(reason);
                }
            });
        }

        if (self.state === 'pending') {
            return promise2 = new Promise(function(resolve, reject) {
                self.callbacks.push({
                    onFulfilled: function(value) {
                        try {
                            var x = onFulfilled(value);
                            resolve(x);
                        } catch (reason) {
                            reject(reason);
                        }
                    },
                    onRejected: function(reason) {
                        try {
                            var x = onRejected(reason);
                            resolve(x);
                        } catch (reason) {
                            reject(reason);
                        }
                    }
                });
            });
        }
    };

    Promise.resolve = function(value) {
        return new Promise(function(resolve) {
            resolve(value);
        });
    };

    Promise.reject = function(reason) {
        return new Promise(function(resolve, reject) {
            reject(reason);
        });
    };

    global.Promise = Promise;
})(window);