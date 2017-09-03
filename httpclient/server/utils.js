objectSize = function (obj) {
    var size = 0, key;
    for (key in obj) {
        size++;
    }
    return size;
};

syncSleep = Meteor.wrapAsync(function(delayMs,callback){
    Meteor.setTimeout(callback,delayMs);
});

randArrValue = function(arr){
    if(!arr||arr.length==0)
        return null;

    var key = Math.floor(Math.random() * arr.length);
    if(isset(arr[key]))
        return arr[key];
    else {
        var keys = [];
        _.each(arr, function (value, key) {
            keys.push(key);
        });
        if(keys.length>0){
            return  arr[Math.floor(Math.random() * keys.length)];
        }
    }
    return null;
};

isset = function(obj){
    return obj===null || typeof(obj)!=='undefined';
};

isEmpty = function(obj){
    if(!obj) return true;
    for(var key in obj)
        return false;
    return true;
};