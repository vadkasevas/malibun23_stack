var PENDING = 0,
    RESOLVED = 1,
    REJECTED = 2;
/**
 * Promise, callback которого выполняется внутри  {@link https://www.npmjs.com/package/fibers|Fibers}
 * @see {@link https://guide.meteor.com/using-npm-packages.html#bind-environment|Meteor bind environment}
 * */
MalibunPromise = class MalibunPromise{
    constructor(fun){
        if (typeof fun !== 'function') {
            throw new Error('MalibunPromise resolver undefined is not a function');
            return;
        }

        var me = this;
        var resolve = function () {
            me.resolve.apply(me, arguments);
        };
        var reject = function () {
            me.reject.apply(me, arguments);
        };

        me._status = PENDING;
        me._onResolved = [];
        me._onRejected = [];
        if(npmFibers.current) {
            fun(resolve, reject, this);
        }else{
            var self = this;
            npmFibers(function(){
                fun(resolve, reject, self);
            }).run();
        }
    }

    then(onResolved, onRejected) {
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
                if(npmFibers.current){
                    var ret = onRejected ? onRejected.apply(null, args) : args;
                    reject(ret);
                }else{
                    npmFibers(function () {
                        var ret = onRejected ? onRejected.apply(null, args) : args;
                        reject(ret);
                    }).run();
                }
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

    catch(onRejected) {
        return this.then(null, onRejected);
    };

    resolve() {
        if (this._status === PENDING) {
            this._status = RESOLVED;
            this._value = arguments;
            for (var i = 0, len = this._onResolved.length; i < len; i++) {
                this._onResolved[i].apply(null, arguments);
            }
        }
    };

    reject() {
        if (this._status === PENDING) {
            this._status = REJECTED;
            this._value = arguments;
            for (var i = 0, len = this._onRejected.length; i < len; i++) {
                this._onRejected[i].apply(null, arguments);
            }
        }
    };

    /**
     * Навешивает обработчик при завершении
     * @param {MalibunPromise~callback} cb  callback при завершении
     * */
    finally(cb, ctx) {
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

    wait(ms) {
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

    sync(){
        var f = Meteor.wrapAsync((cb)=>{
            this.finally(cb);
        });
        return f();
    }
    
    isResolved() {
        return this._status != PENDING;
    };

    static resolve(obj) {
        if (MalibunPromise.isPromise(obj)) {
            return obj;
        }
        return new MalibunPromise(function (resolve) {
            resolve(obj);
        });
    };

    static reject(obj) {
        if (MalibunPromise.isPromise(obj)) {
            return obj;
        }
        return new MalibunPromise(function (resolve, reject) {
            reject(obj);
        });
    };

    static isPromise(obj) {
        return obj instanceof MalibunPromise;
    };
}

/**
 * Обработчик при завершении
 * @callback MalibunPromise~callback
 * @param {Error|null} err Ошибка
 * @param result Результат
 */
MalibunPromise.PENDING = PENDING;
MalibunPromise.RESOLVED = RESOLVED;
MalibunPromise.REJECTED = REJECTED;
