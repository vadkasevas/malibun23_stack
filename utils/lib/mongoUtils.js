cursorForEachChunked = function(collection,condition,callback,chunkSize,options){
    options = options || {};
    if(!chunkSize)
        chunkSize = 50000;
    var skip=0;
    while(true) {
        options.limit = chunkSize;
        options.skip = skip;
        var models = collection.find(condition, options).fetch();
        skip = skip+chunkSize;
        _.each(models,function(model){
            callback(model);
        });
        if(models.length==0||models.length<chunkSize)
            break;
    }
};


eachCursorChunk = function(collection,condition,chunkCallback,chunkSize,options){
    chunkSize = chunkSize || 1000000;
    var chunk = [];
    var onModel = function(model,last){
        if(model)
            chunk.push(model);

        if( (last&&chunk.length>0) ||chunk.length>=chunkSize){
            chunkCallback(chunk);
            chunk = [];
        }
    };
    cursorForEachChunked(collection,condition,function(model){
        onModel(model,false);
    },chunkSize,options);
    onModel(null,true);
};

