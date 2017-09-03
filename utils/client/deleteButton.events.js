Template.deleteButton.events({
    'click .deleteButton': function (e) {
        e.preventDefault();
        console.log(this.model);
        var model = this.model;
        var collection = global[this.collection];
        console.log(`Удаляем ${collection._name} _id=`+model._id);
        var preparePattern = function(pattern){
            return pattern.replace(/\{([^\}]+)\}/gi,function(match0,match1){
                return safeGet(model,match1,match0);
            });
        };

        if(confirm(preparePattern(this.confirm))){
            var self = this;
            collection.remove({_id:model._id},function(err){
                if(self.success&&!err)
                    alert(preparePattern(self.success));
                else
                    alert(err);
            });
        }
    }
});

