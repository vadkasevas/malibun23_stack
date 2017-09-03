if(Promise){
    Promise.prototype.finally = function(cb,ctx){
        if(ctx)
            cb.bind(ctx);
        return this.then(
            (result)=>{
                cb(null,result);
            },
            (err)=>{
                cb(err,null);
            }
        );
    }
}

doWhile = (cb,maxIterations)=>{
    var iterationIndex = 0;
    return new MalibunPromise((resolve,reject)=>{
         var iteration = ()=>{
             cb().finally((err,result)=>{
                 if( (!maxIterations||iterationIndex++<maxIterations) &&( err||!result) )
                     iteration();
                 else
                     resolve(result);
             });
         };
         iteration();
    });

};






