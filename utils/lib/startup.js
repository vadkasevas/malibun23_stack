var orginalStartup = Meteor.startup;

var emitter = new EventEmitter();
emitter.setMaxListeners(0);
var queuedCount = 0;

var beforeStartup = _.once(function(){
    emitter.emit('beforeStartup');
});

Meteor.startup = function(cb){
    queuedCount++;
    orginalStartup(function(){
        beforeStartup();
        cb();
        queuedCount--;
        if(queuedCount==0)
            emitter.emit('afterStartup');
    });
};

Meteor.beforeStartup = function(cb){
    emitter.once('beforeStartup',function(){
        cb();
    });
};

Meteor.afterStartup = function(cb){
    emitter.once('afterStartup',function(){
        cb();
    });
};

Meteor.startup(function(){});
