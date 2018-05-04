@component
class MalibunCluster extends EventEmitter{
    constructor(){
        super();
        this.setMaxListeners(0);
        var self = this;
        var getParam = function (propKey,globKey) {
            if(Meteor.isServer){
                self[propKey] = safeGet(process,`env.${globKey}`,false);
                Meteor.settings.public[globKey] = self[propKey];
            }else{
                self[propKey] = safeGet(Meteor.settings,`public.${globKey}`,false);
            }
        };
        getParam('testMode','MALIBUN_CLUSTER_TESTMODE');
        getParam('CLUSTER_WORKERS_COUNT','CLUSTER_WORKERS_COUNT');

        var workersCount = self.CLUSTER_WORKERS_COUNT;
        if(workersCount) {
            if(Meteor.isServer) {
                if (("" + workersCount).toLowerCase() === "auto") {
                    workersCount = Npm.require('os').cpus().length;
                }
            }
            workersCount = parseInt(workersCount) || 0;
        }else{
            workersCount = 0;
        }
        self.CLUSTER_WORKERS_COUNT = workersCount;
        getParam('MALIBUN_CLUSTER','MALIBUN_CLUSTER');
        getParam('CLUSTER_WORKER_ID','CLUSTER_WORKER_ID');
        getParam('CLUSTER_IS_SERVER','CLUSTER_IS_SERVER');

        this.workers = [];
        if(Meteor.isServer) {
            this.on('worker', (worker)=>{
                worker.process.once('exit', (exitCode, signalCode)=>{
                    this.workers = _.filter(this.workers,(_worker)=>{
                        return _worker != worker;
                    })
                });
                self.workers.push(worker);
            });

            if (this.isWorker()) {
                process.title = 'clusterWorker' + this.workerId();
            } else if (this.isServer()) {
                process.title = 'clusterServer';
            } else
                process.title = 'clusterClient';

            var ip = '127.0.0.1';
            if(!process.env.ROOT_URL){
                console.log('process.env.ROOT_URL не задан')
            }else{
                var npmUrl = Npm.require('url');
                var urlData = npmUrl.parse(process.env.ROOT_URL);
                ip = urlData.hostname;
            }
            this.ip = ip;
        }



    }

    eachWorker(cb){
        var workerId = 0;
        while(workerId<this.CLUSTER_WORKERS_COUNT){
            workerId++;
            cb(workerId);
        }
    }

    /**@returns {boolean} */
    isMaster(){
        if(this.testMode)
            return true;
        return !this.CLUSTER_WORKER_ID;
    };

    isWorker(){
        return this.testMode ? true : this.workerId()>0;
    }

    workerId(){
        return this.testMode ? 1 : Number( this.CLUSTER_WORKER_ID  );
    }

    isServer(){
        return this.testMode ? true : this.CLUSTER_IS_SERVER==1;
    }

    getState(){
        if(this.isWorker())
            return 'CWorker '+this.workerId();
        else if(this.isServer())
            return 'CServer ';
        else
            return 'CClient';
    }

    log(){
        if(this.isWorker()){
            var newArgs = ['Воркер:' + this.workerId()].concat( _.toArray(arguments) );
            return console.log.apply(console, newArgs);
        }else{
            return console.log.apply(console, arguments);
        }
    }


};

Cluster = new MalibunCluster();

if(Meteor.isServer){

    Meteor.publish('clusterWorkers', function () {
        var self = this;
        self.ready();
        var listener = function(worker){
            self.added('clusterWorkers', worker.id, {ip:Cluster.ip,port:String(worker.port)});
        };
        _.each(Cluster.workers,listener);

        Cluster.on('worker',listener);
        self.onStop(function () {
            Cluster.removeListener('worker',listener);
        });
    });
    Meteor.methods({
        clusterWorkers:function(){
            var result = Cluster.workers.map(function(worker){
                return {ip:Cluster.ip,port:String(worker.port)}
            });
            //console.log('clusterWorkers:',result);
            return result;
        }
    });

}



