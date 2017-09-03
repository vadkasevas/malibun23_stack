var PENDING = 0,
    RESOLVED = 1,
    REJECTED = 2;

MalibunPromise = function (fun) {

    if (typeof fun !== 'function') {
        throw new Error('MalibunPromise resolver undefined is not a function');
        return;
    }

    var me = this,
        resolve = function () {
            me.resolve.apply(me, arguments);
        },
        reject = function () {
            me.reject.apply(me, arguments);
        };
    me._status = PENDING;
    me._onResolved = [];
    me._onRejected = [];

    fun(resolve, reject, this);
};
MalibunPromise.PENDING = PENDING;
MalibunPromise.RESOLVED = RESOLVED;
MalibunPromise.REJECTED = REJECTED;

var fn = MalibunPromise.prototype;

fn.then = function (onResolved, onRejected) {
    var self = this;
    return new MalibunPromise(function (resolve, reject) {
        var onResolvedWraper = function () {
            var args = arguments;
            npmFibers(function () {
                var ret = onResolved ? onResolved.apply(null, args) : args;
                if (MalibunPromise.isPromise(ret)) {
                    ret.then(function () {
                        resolve.apply(null, arguments);
                    });
                } else {
                    resolve.apply(null, args);
                }
            }).run();
        };
        var onRejectedWraper = function () {
            var args = arguments;
            npmFibers(function () {
                var ret = onRejected ? onRejected.apply(null, args) : args;
                reject(ret);
            }).run();
        };

        self._onResolved.push(onResolvedWraper);
        self._onRejected.push(onRejectedWraper);

        if (self._status === RESOLVED) {
            onResolvedWraper.apply(null, self._value);
        }

        if (self._status === REJECTED) {
            onRejectedWraper.apply(null, self._value);
        }
    });
};

fn.catch = function (onRejected) {
    return this.then(null, onRejected);
};

fn.resolve = function () {
    if (this._status === PENDING) {
        this._status = RESOLVED;
        this._value = arguments;
        for (var i = 0, len = this._onResolved.length; i < len; i++) {
            this._onResolved[i].apply(null, arguments);
        }
    }
};

fn.reject = function () {
    if (this._status === PENDING) {
        this._status = REJECTED;
        this._value = arguments;
        for (var i = 0, len = this._onRejected.length; i < len; i++) {
            this._onRejected[i].apply(null, arguments);
        }
    }
};

fn.finally = function (cb, ctx) {
    if (ctx)
        cb.bind(ctx);

    if (cb instanceof MalibunPromise) {
        return this.finally(function (err) {
            if (err)
                return cb.reject.apply(cb, arguments);
            var args = [];
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
            }
            return cb.resolve.apply(cb, args);
        });
    } else {
        return this.then(
            function (result) {
                var args = [null];
                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
                cb.apply(null, args);
            },
            cb
        );
    }


};

fn.wait = function (ms) {
    var parent = this;
    return new MalibunPromise((resolve, reject)=> {
        parent.finally(function (err) {
            if (err) {
                var args = arguments;
                Meteor.setTimeout(function () {
                    reject.apply(null, args);
                }, ms);
            } else {
                var args = [];
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }
                }
                Meteor.setTimeout(function () {
                    resolve.apply(null, args);
                }, ms);
            }

        });
    });
};

fn.isResolved = function () {
    return this._status != PENDING;
};

MalibunPromise.resolve = function (obj) {
    if (MalibunPromise.isPromise(obj)) {
        return obj;
    }
    return new MalibunPromise(function (resolve) {
        resolve(obj);
    });
};

MalibunPromise.reject = function (obj) {
    if (MalibunPromise.isPromise(obj)) {
        return obj;
    }
    return new MalibunPromise(function (resolve, reject) {
        reject(obj);
    });
};

MalibunPromise.isPromise = function (obj) {
    return obj instanceof MalibunPromise;
};