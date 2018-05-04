@component
class MalibunProgress{
    constructor(hashOrAttributes){
        this.attributes = {};
        if(hashOrAttributes){
            if(_.isString(hashOrAttributes))
                this.attributes.hash = hashOrAttributes;
            else{
                this.attributes = hashOrAttributes;
            }
        }

        this.attributes = _.extend({
            hash:generateRandomHash(),
            percent:0,
            title:0,
            data:0,
            finished:false,
            constructorname:this.constructor.name
        },this.attributes);
        MalibunProgress.cache[this.hash] = this;
        MalibunProgress.emitter.emit('malibunprogress',this);
        MalibunProgress.emitter.emit('malibunprogress'+this.hash,this);
        var self = this;
        this._changed = _.throttle(function(){
            MalibunProgress.emitter.emit('changed',self);
        }, 1000);
    }

    changed(){
        this._changed();
    }

    finish(){
        this.attributes.finished = true;
        this.changed();
    }

    get hash(){
        return this.attributes.hash;
    }

    get percent(){
        return this.attributes.percent;
    }

    get title(){
        return this.attributes.title;
    }

    get finished(){
        return this.attributes.finished;
    }

    static byHash(hash,cb){
        if(Meteor.isServer) {
            return MalibunProgress.cache[hash] || null;
        }else{
            Meteor.call('malibunProgress',hash,cb);
        }
    }


};

MalibunProgress.cache = {};
MalibunProgress.emitter = new EventEmitter();
MalibunProgress.emitter.setMaxListeners(0);

if(Meteor.isServer){
    Meteor.methods({
        newMalibunProgress:function(hash){
            return new MalibunProgress(hash);
        },
        malibunProgress:function(hash){
            return Progress.byHash(hash);
        }
    });
    Meteor.publish("malibunprogress", function(hash){
        var subscription = this;
        var progress = MalibunProgress.byHash(hash);

        var added = function(progress){
            subscription.added('malibunprogress', hash, {attributes:progress.attributes});
            var changedlistener = function(progress){
                try {
                    if(hash==progress.hash)
                        subscription.changed('malibunprogress', progress.hash, {attributes: progress.attributes});
                }catch (e){
                    console.log(e);
                }
            };
            MalibunProgress.emitter.on('changed',changedlistener);
            subscription.onStop(function () {
                MalibunProgress.emitter.removeListener('changed',changedlistener);
            });
        };
        if(progress)
            added(progress);
        else
            MalibunProgress.emitter.once('malibunprogress'+hash,function(progress){
                added(progress);
            });
        subscription.ready();
    });
}else{
    MalibunProgress.collection = new Mongo.Collection('malibunprogress');
}