CollectionPermissions = class CollectionPermissions{
    constructor(collection,permissions){
        this.collection=collection;
        this.options=permissions;
        var self = this;
        collection.allow({
            insert: function (userId, doc) {
                return self.checkInsert(userId,doc);
            },
            update: function (userId, doc, fields, modifier) {
                return self.checkUpdate(userId,doc,modifier);
            },
            remove: function (userId, doc){
                return self.checkRemove(userId,doc);
            }
        });

    }

    getCtx(userOrId){
        let $userId = undefined;
        let $user = undefined;
        if(userOrId){
            if(_.isString(userOrId)){
                $userId = userOrId;
            }else{
                $user = userOrId;
                $userId = userOrId._id;
            }
        }

        let ctx = {};
        Object.defineProperty(ctx, '$userId', {
            get: function() { return $userId; },
            enumerable: true,
            configurable: false,
            //writable:false
        });
        Object.defineProperty(ctx, '$user', {
            get: function() {
                if(!$user&&$userId){
                    $user = Meteor.users.findOne({_id:$userId});
                }
                return $user;
            },
            enumerable: true,
            configurable: false,
            //writable:false
        });
        return ctx;
    }

    /**
     * @returns {Object} modifier
     * @returns {Object} modifier.selector
     * @returns {Object} modifier.options
     * */
    normalizeModifier(modifier){
        if(modifier instanceof MongoHelper){
            return {
                selector:modifier.seletor(),
                options:modifier.options()
            }
        }
        if(modifier.seletor){
            return {
                selector: modifier.seletor,
                options: modifier.options
            }
        }
        return undefined
    }

    insert(doc,user){
        if(this.options.insert){
            let newDoc =  this.options.insert.apply(this.getCtx(user),[doc] );
            if(newDoc)
                doc = newDoc;
        }
        return this.collection.insert(doc);
    }

    /**@returns {Mongo.Cursor}*/
    find(selector,options,user){
        let $modifier = null;
        if(this.options.find){
            $modifier = this.normalizeModifier( this.options.find.apply(this.getCtx(user),[selector,options]) );
        }
        if(!$modifier){
            return this.collection.find(selector,options);
        }else{
            return this.collection.find($modifier.selector , $modifier.options);
        }
    }

    update(selector, modifier,options,user){
        let $modifier = null;
        if(this.options.update){
            $modifier = this.normalizeModifier( this.options.update.apply( this.getCtx(user),[selector,modifier,options] ) );
        }
        if(!$modifier){
            return this.collection.update(selector,modifier,options);
        }else{
            return this.collection.update($modifier.selector,modifier,modifier.options);
        }
    }

    remove(selector,user){
        let $modifier = null;
        if(this.options.remove){
            $modifier = this.normalizeModifier( this.options.remove.apply( this.getCtx(user),[selector] ) );
        }
        if(!$modifier){
            return this.collection.remove(selector);
        }else{
            return this.collection.remove($modifier.selector);
        }
    }

    checkData(data,p){
        data = _.isString(data) ? {
            'default':data
        } : data;
        var filter = function(perms){
            if(perms.indexOf('w')>-1&&['i','u','d'].indexOf(p)>-1)
                return true;
            return perms.indexOf(p)>-1;
        };
        var disallowedFields = null;
        var allowedFields = null;
        if(isset(data.fields)){
            _.each(data.fields,function(val,key){
                var perms = _.isArray(val) ? key : val;
                var fields = _.isArray(val) ? val : [key];
                if(!filter(perms)){
                    disallowedFields = disallowedFields || [];
                    disallowedFields = disallowedFields.concat(fields);
                }else{
                    allowedFields = allowedFields || [];
                    allowedFields = allowedFields.concat(fields);
                }
            });
        }
        return {
            allowed:isset(data.default)?filter(data.default):true,
            disallowedFields:disallowedFields,
            allowedFields:allowedFields
        };
    }

    checkDoc(doc,data,p){
        var checkData = this.checkData(data,p);
        if(!checkData.allowed)
            return false;
        if(!checkData.disallowedFields)
            return true;
        var result = true;
        _.each(doc,function (val,key) {
            if(checkData.disallowedFields.indexOf(key)>-1)
                result = false;
        });
        return result;
    };

    checkInsert(userId,doc){
        var self = this;
        if(userId) {
            var result = false;
            var userIdField = safeGet(this.options,'userIdField',null);
            if(userIdField && safeGet(this.options,'owner',false) && safeGet(doc,userIdField,null)==userId){
                result = self.checkDoc(doc,this.options.owner,'i');
            }
            if(result)
                return result;
            _.each(safeGet(this.options, 'group', {}), function (groupData,groupName) {
                if(!result&&Roles.userIsInRole(userId,groupName)){
                    result = self.checkDoc(doc,groupData,'i');
                }
            });
            if(result)
                return result;
        }

        if(this.options.default)
            return self.checkDoc(doc,this.options.default,'i');
        return false;
    }

    checkUpdate(userId,doc,modifier){
        var self = this;
        var checkFullDoc = function(groupData) {
            if(isset(modifier.$set)&&!self.checkDoc(modifier.$set,groupData,'u'))
                return false;
            if(isset(modifier.$unset)&&!self.checkDoc(modifier.$set,groupData,'d'))
                return false;
            if(isset(modifier.$push)&&!self.checkDoc(modifier.$push,groupData,'u'))
                return false;
            if(isset(modifier.$pop)&&!self.checkDoc(modifier.$pop,groupData,'u'))
                return false;
            return true;
        };
        if(userId) {
            var result = false;
            var userIdField = safeGet(this.options,'userIdField',null);
            if(userIdField && safeGet(this.options,'owner',false) && safeGet(doc,userIdField,null)==userId){
                result = checkFullDoc(this.options.owner);
            }
            if(result)
                return result;

            _.each(safeGet(this.options, 'group', {}), function (groupData,groupName) {
                if(!result&&Roles.userIsInRole(userId,groupName)){
                    result = checkFullDoc(groupData);
                }
            });
            if(result)
                return result;
        }

        if(this.options.default)
            return checkFullDoc(this.options);
        return false;
    }

    checkRemove(userId,doc){
        var self = this;
        if(userId) {
            var userIdField = safeGet(this.options,'userIdField',null);
            if(userIdField && safeGet(this.options,'owner',false) && safeGet(doc,userIdField,null)==userId){
                var checkData = this.checkData(this.options.owner,'d');
                if(checkData.allowed)
                    return true;
            }
            var result = false;
            _.each(safeGet(this.options, 'group', {}), function (groupData,groupName) {
                if(!result&&Roles.userIsInRole(userId,groupName)){
                    var checkData = self.checkData(groupData,'d');
                    if(checkData.allowed)
                        result = true;
                }
            });
            if(result)
                return result;
        }

        if(this.options.default){
            var checkData = this.checkData(this.options.default,'d');
            return (checkData.allowed);
        }
        return false;
    }

    findCondition(userId){
        var self = this;
        var getCondition = function(groupData){
            var checkData = self.checkData(groupData,'r');
            var options = {};
            if(checkData.disallowedFields){
                options.fields = {};
                _.each(checkData.disallowedFields,function(field){
                    options.fields[field] = 0;
                });
            }
            return {
                condition:checkData.allowed?{}:null,
                options:options
            }
        };

        var result = { owner:null, default:null, group:{} };
        if(userId) {
            var userIdField = safeGet(this.options,'userIdField',null);
            if(userIdField && safeGet(this.options,'owner',false) ){
                result.owner = getCondition(this.options.owner);
                if(result.owner.condition)
                    result.owner.condition[userIdField]=userId;
            }
            _.each(safeGet(this.options, 'group', {}), function (groupData,groupName) {
                if(Roles.userIsInRole(userId,groupName)){
                    result.group[groupName] = getCondition(groupData);
                }
            });
        }

        if(this.options.default)
            result.default = getCondition(this.options.default);
        return result;
    }
};

CollectionPermissions.DEFAULT = {
    'default':'rw'
};