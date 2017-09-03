npmAsync = Npm.require('async');
meteorAsync = {
    parallel: function (fs, callback) {
        var wrappedFs = fs.map((_f)=> {
            return function (callback) {
                npmFibers(function () {
                    _f(callback);
                }).run();
            };
        });

        return new MalibunPromise((resolve, reject)=> {
            npmAsync.parallel(wrappedFs, (err, results)=> {
                npmFibers(function () {
                    if (callback)
                        callback.apply(null, [err, results]);
                    if (err)
                        reject(err, results);
                    else
                        resolve(results);
                }).run();
            });
        });
    },

    waterfall: function (fs, callback) {
        var wrappedFs = fs.map((_f)=> {
            return function () {
                var newArgs = [arguments[arguments.length - 1]];
                _.each(arguments, function (value, index) {
                    if (index < arguments.length - 1)
                        newArgs.push(value);
                });
                npmFibers(function () {
                    var promise = _f.apply(null, newArgs);
                    if (MalibunPromise.isPromise(promise))
                        promise.finally(newArgs[0]);
                }).run();
            };
        });

        return new MalibunPromise(function (resolve, reject) {
            npmAsync.waterfall(wrappedFs, function (err, result) { 
                npmFibers(function () {
                    if (callback)
                        callback(err, result);
                    if (err)
                        reject(err, result);
                    else
                        resolve(result);
                }).run();
            });
        });
    },

    seq: function (fs, callback) {
        var wrappedFs = fs.map((_f)=> {
            return function (handler, callback) {
                npmFibers(function () {
                    _f.apply(null, [handler, callback]);
                }).run();
            };
        });

        return new MalibunPromise(function (resolve, reject) {
            var seq = npmAsync.seq.apply(null, wrappedFs);
            return seq({}, function (err, handler) {
                if (callback)
                    callback(err, handler);
                if (err)
                    reject(err, handler);
                else
                    resolve(handler);
            });
        });
    },

    seqNew: function (fs, callback) {
        var wrappedFs = fs.map((_f)=> {
            return function (handler, callback) {
                var callbackWrapper = (err, fResult)=> {
                    handler[_f.name] = fResult;
                    try {
                        callback(err, handler);
                    }catch(e){
                        console.log('handler:',handler);
                        console.log('_f:',_f);
                        console.log(e.trace);
                        console.log(e);
                    }
                };
                npmFibers(function () {
                    var promise = _f.apply(null, [handler, callbackWrapper]);
                    if (MalibunPromise.isPromise(promise))
                        promise.finally(callbackWrapper);
                }).run();
            };
        });

        return new MalibunPromise(function (resolve, reject) {
            var seq = npmAsync.seq.apply(null, wrappedFs);
            return seq({}, function (err, handler) {
                npmFibers(function () {
                    var newHandler = handler;
                    if (callback)
                        newHandler = callback.apply(null, [err, handler]) || handler;
                    if (err)
                        reject(err, newHandler);
                    else
                        resolve(newHandler);
                }).run();
            });
        });
    },

    parallelNew: function (fs, callback) {
        var handler = {};

        var wrappedFs = fs.map((_f)=> {
            return function (callback) {
                var callbackWrapper = (err, fResult)=> {
                    handler[_f.name] = fResult;
                    callback(err);
                };
                npmFibers(function () {
                    _f(callbackWrapper);
                }).run();
            };
        });

        return new MalibunPromise((resolve, reject)=> {
            npmAsync.parallel(wrappedFs, (err)=> {
                npmFibers(function () {
                    var newHandler = handler;
                    if (callback)
                        newHandler = callback.apply(null, [err, handler]) || handler;
                    if (err)
                        reject(err, newHandler);
                    else
                        resolve(newHandler);
                }).run();
            });
        });
    },

    race:function(fs,cb){
        return new MalibunPromise(function(resolve,reject){
            var wrappedFs = fs.map((_f)=> {
                return function (cb) {
                    npmFibers(function () {
                        var promise = _f.apply(null, [cb]);
                        if (MalibunPromise.isPromise(promise))
                            promise.finally(cb);
                    }).run();
                };
            });
            npmAsync.race(wrappedFs,function(err, result) {
                reject(err,result);
                if(cb){
                    cb(err,result);
                }
            });
        });
    }
};