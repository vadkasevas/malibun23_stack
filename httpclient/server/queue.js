var queueLength = 0;

HttpClient.listener.on('beforeExecute',function(){
    queueLength++;
});

HttpClient.listener.on('afterExecute',function(){
    if(queueLength>0) queueLength--;
});

HttpClient.listener.waitQueue = Meteor.wrapAsync((maxlength,callback)=>{
    var interval = Meteor.setInterval(()=>{
        if(queueLength<=maxlength){
            callback(null,queueLength);
            Meteor.clearInterval(interval);
        }
    },2000);
});