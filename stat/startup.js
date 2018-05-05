Meteor.afterStartup(function(){
    return;
    MalibunStats._ensureIndex({'expires': 1});

    Meteor.setInterval(function(){
        const chunkSize = 10000;
        var skip=0;
        while(true) {
            var models = MalibunStats.find( {expires:{$lte:new Date()}} , { limit:chunkSize,skip:skip,sort:{label:1,date_from:1} } ).fetch();
            var deleteIds = {};
            skip = skip+chunkSize;
            _.each(models,
                /**@param {MalibunStatsModel} model*/
                function(model,index){
                    if(!model.root && !isset(deleteIds[model._id]) && isset(MalibunStats.types[model.type]) ){
                        /**@type {TypeOptions}*/
                        var opts = MalibunStats.types[model.type];
                        var precision = opts.precision(model);
                        var expires = opts.expires(model);
                        if(precision&&expires) {
                            var changed = false;
                            if(index<models.length-1) {
                                for (let i = index + 1; i < models.length; i++) {
                                    /**@type {MalibunStatsModel} model3*/
                                    /**@type {MalibunStatsModel}*/
                                    var model2 = models[i];
                                    if (model2.label == model.label && !isset(deleteIds[model2._id])) {
                                        if (+model.date_from + precision * 1000 > +model2.date_from) {
                                            model.precision = precision;
                                            model.date_to = new Date( Math.max(model.date_to,model2.date_to) );
                                            model.expires = opts.expires(model);
                                            opts.join.apply(model, [model2]);
                                            changed = true;
                                            deleteIds[model2._id] = 1;
                                        } else
                                            break;
                                    }
                                }
                            }
                            if(changed){
                                model.update(['precision', 'date_to', 'expires', 'data']);
                                var updated = MalibunStats.update({_id:{$ne:model._id},label:model.label,type:model.type,
                                    $and:[
                                        {date_from:{$gt:model.date_from}},
                                        {date_from:{$lt:model.date_to}}
                                    ]},
                                    {$set:{root:model._id}},
                                    {multi:true,validate:false}
                                );
                                console.log('updated:',updated);
                            }
                        }else{
                            deleteIds[model._id] = 1;
                        }
                    }
                });
            var deleteIdArr = _.keys(deleteIds);
            if(deleteIdArr.length>0){
                skip = skip-MalibunStats.remove({_id:{$in:deleteIdArr} });
            }
            if(models.length==0||models.length<chunkSize)
                break;
        }

    },30*1000);

});