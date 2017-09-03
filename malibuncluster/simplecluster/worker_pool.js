if(Cluster.MALIBUN_CLUSTER=='simplecluster') {
    var child_process = Npm.require('child_process');
    var portscanner = Npm.require('portscanner');

    if (process.env['CLUSTER_WORKER_ID']) {
        WebApp.onListening(function () {
            process.send({
                type: "ready"
            });
        });
    }

    WorkerPool = class WorkerPool{
        constructor(size){
            if (process.env['CLUSTER_WORKER_ID'])
                return;
            var self = this;
            this._exec = process.argv[1];
            this._args = process.argv.slice(2);
            this._workersMap = {};

            this._ids = 0;
            this._closed = false;

            for (var lc = 0; lc < size; lc++) {
                this._createWorker();
            }

            this._recentReconnects = 0;
            this._lastReconnectAt = 0;

            _.each(['SIGINT', 'SIGHUP', 'SIGTERM'], function (sig) {
                process.once(sig, self._cleanup.bind(self));
            });
        }

        pickWorker() {
            if(_.size(this._workersMap)==0)
                return null;
            var worker = _.pick( _.sample(this._workersMap), "id", "port", "process");
            return worker;
        }

        hasWorker(id) {
            return !!this._workersMap[id];
        }

        findPort(cb) {
            var findPort = function (callback) {
                var port = Math.ceil(Math.random() * 20000) + 20000;
                portscanner.checkPortStatus('127.0.0.1', port, function (err, status) {
                    var success = status == 'closed';
                    callback(port, success);
                });
            };

            var findPortCb = function (port, success) {
                if (success)
                    return cb(null, port);
                else
                    return findPort(findPortCb);
            };

            findPort(findPortCb);

        }

        _fork(id) {
            var self = this;
            id = id || ++self._ids;

            return new MalibunPromise((resolve,reject)=>{
                meteorAsync.seqNew([
                    function findPort(h,cb){
                        self.findPort(cb);
                    },
                    function fork(h,cb){
                        var env = _.extend(_.clone(process.env), {
                            'PORT': h.findPort,
                            'CLUSTER_WORKER_ID': id
                        });

                        _.each(env,function(val,key){
                            var matches;
                            if ((matches = /^cluster(\d+)_(.*)/gi.exec(key)) != null){
                                var cIndex = matches[1] ? Number(matches[1]) : null;
                                var cKey = matches[2];
                                if(!cIndex||cIndex==id){
                                    env[cKey] = val;
                                }
                            }
                        });

                        var _process = child_process.fork(self._exec, self._args, {
                            env: env,
                            silent: false
                        });

                        var worker = {
                            process: _process,
                            id: id,
                            port: env.PORT
                        };

                        cb(null,worker);
                    }
                ]).finally(function(err,h){
                    reject(err,h.fork);
                });
            });
        }


        _createWorker(id) {
            var self = this;

            self._fork(id).finally(function(err,worker){
                var message = "Cluster: Initializing worker %s on port %s";
                console.info(message, worker.id, worker.port);

                worker.process.on('message', registerWorker);

                // TODO: learn a bit about exitCode and signalCode
                worker.process.once('exit', function (exitCode, signalCode) {
                    var message = "Cluster: Exiting worker %s with exitCode=%s signalCode=%s";
                    console.info(message, worker.id, exitCode, signalCode);

                    // Sometimes, It's possible to exit the worker
                    // even before it became ready
                    if(isset(self._workersMap[worker.id])){
                        delete self._workersMap[worker.id];
                    }
                    if (!self._closed) {
                        var reconnectTimeout = self._getReconnectTimeout();
                        setTimeout(function () {
                            self._createWorker(worker.id);
                        },reconnectTimeout||0)
                    }
                });

                function registerWorker(message) {
                    if (message && message.type === "ready") {
                        Cluster.emit('worker', worker);
                        self._workersMap[worker.id] = worker;
                        process.removeListener('message', registerWorker);
                    }
                }
            });
        }

        _cleanup(sig) {
            this._closed = true;
            _.each(this._workersMap,function(worker){
                worker.process.kill(sig);
            });
            process.kill(process.pid, sig);
        }

        _getReconnectTimeout() {
            var timeDiff = Date.now() - this._lastReconnectAt;
            var oneMinTime = 1000 * 60;
            if (timeDiff > oneMinTime) {
                this._recentReconnects = 0;
            }

            var reconnectTime = this._recentReconnects * 500;

            this._recentReconnects++;
            this._lastReconnectAt = Date.now();

            return reconnectTime;
        }

    };




}