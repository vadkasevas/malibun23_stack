MongoLock = class MongoLock extends EventEmitter{
    constructor(){
        super();
        this.setMaxListeners(0);
        this.modelsById = {};
        //this.id = Meteor.Collection.ObjectID()._str;
        var lock = this;
        MongoLock.Collection.find({}).observeChanges({
            added:(id)=>{
                //console.log('added:',id);
                var model = MongoLock.Collection.findOne({_id:id});
                if(!model) return;
                lock.modelsById[id] = model;
                lock.emit('added',model);
            },
            changed:(id,fields)=>{
                var model = MongoLock.Collection.findOne({_id:id});// {_id:id,locked:fields.locked,updated:fields.updated};
                //console.log('model:',model);
                if(!model) return;
                lock.modelsById[id] = model;
                lock.emit('changed',model);
                //console.log('modelsById:',lock.modelsById);
            },
            removed:(id)=>{
                //console.log('removed id:',id);
                if(lock.modelsById[id]) {
                    var model = lock.modelsById[id];
                    delete lock.modelsById[id];
                    lock.emit('removed',model);
                }
            }
        });
    }

    isLocked(key){
        return !!MongoLock.Collection.findOne({_id:key,locked:true});
    }
    
    lock(key){
        var lock = this;
        return new MalibunPromise((resolve,reject)=>{
            return meteorAsync.seqNew([
                function insert(handler,cb){
                    if(isset(lock.modelsById[key]))
                        return cb(null,false);
                    MongoLock.Collection.insert({_id:key,locked:true,updated:new Date()},(err,_id)=>{
                        cb(null,!!_id);
                    });
                },
                function update(handler,cb){
                    if(handler.insert)
                        return cb();
                    if(isset(lock.modelsById[key])&&lock.modelsById[key].locked)
                        return cb();

                    MongoLock.Collection.update(
                        {_id:key,locked:false},
                        {$set:{locked:true,updated:new Date()}},
                        {multi:false,validate:false}
                        ,(err,count)=>{
                            cb(null,count>0);
                        }
                    );
                },
                function listen(handler,cb){
                    if(handler.insert||handler.update)
                        return cb();
                    if(isset(lock.modelsById[key])&&!lock.modelsById[key].locked){
                        lock.lock(key).finally((err,result)=>{
                            cb(null,result);
                        });
                        return;
                    }
                    cb = _.once(cb);
                    var onResult = (err,success)=>{
                        if(success){
                            lock.removeListener('changed',onChanged);
                            lock.removeListener('removed',onRemoved);
                            cb(null,success);
                        }
                    };

                    var onChanged = function(model){
                        if(model._id!=key||model.locked/*||lock.modelsById[key].locked*/)
                            return;
                        MongoLock.Collection.update(
                            {_id:key,locked:false},
                            {$set:{locked:true,updated:new Date()}},
                            {multi:false,validate:false}
                            ,(err,count)=>{
                                //if(count>0)
                                  //  lock.modelsById[key].locked = true;
                                onResult(null,count>0);
                            }
                        );
                    };
                    var onRemoved = function(model){
                        if(model._id!=key)
                            return;
                        MongoLock.Collection.insert({_id:key,locked:true,updated:new Date()},(err,_id)=>{
                            onResult(null,!!_id);
                        });
                    };
                    lock.on('changed',onChanged);
                    lock.on('removed',onRemoved);
                }
            ]).finally(function(err,handler){
                resolve(handler.insert||handler.update||handler.listen);
            });
            
        });
    }
    
    unlock(key){
        var lock = this;
        return new MalibunPromise((resolve,reject)=>{
            //if( !isset(lock.modelsById[key]) || !lock.modelsById[key].locked)
              //  return resolve();
            
            MongoLock.Collection.update(
                {_id:key,locked:true},
                {$set:{locked:false,updated:new Date()}},
                {multi:false,validate:false}
                ,(err,count)=>{
                    resolve();
                }
            );
            
        });
    }
    
    static getInstance(){
        if(!MongoLock.instance){
            MongoLock.instance = new MongoLock();
        }
        return MongoLock.instance;
    }
};
MongoLock.Collection = new Mongo.Collection('mongoLocks');

MongoLockPromise = function (key,cb,instance) {
    instance = instance || MongoLock.getInstance();
    return new MalibunPromise((_resolve,_reject,promise)=>{
         instance.lock(key).finally((err,result)=>{
             promise.finally(function(){
                 instance.unlock(key);
             });
             cb(_resolve,_reject,promise);
        });

    });
};






