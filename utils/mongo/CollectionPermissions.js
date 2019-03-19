CollectionPermissions = class CollectionPermissions{
    constructor(collection,permissions){
        this.collection=collection;
        this.permissions=permissions;
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
        /*this.collection.deny({
            update: function (userId, doc, fields, modifier) {
                return false;
            },
            remove: function (userId, doc) {
                return false;
            }
        });*/
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
            var userIdField = safeGet(this.permissions,'userIdField',null);
            if(userIdField && safeGet(this.permissions,'owner',false) && safeGet(doc,userIdField,null)==userId){
                result = self.checkDoc(doc,this.permissions.owner,'i');
            }
            if(result)
                return result;
            _.each(safeGet(this.permissions, 'group', {}), function (groupData,groupName) {
                if(!result&&Roles.userIsInRole(userId,groupName)){
                    result = self.checkDoc(doc,groupData,'i');
                }
            });
            if(result)
                return result;
        }

        if(this.permissions.default)
            return self.checkDoc(doc,this.permissions.default,'i');
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
            var userIdField = safeGet(this.permissions,'userIdField',null);
            if(userIdField && safeGet(this.permissions,'owner',false) && safeGet(doc,userIdField,null)==userId){
                result = checkFullDoc(this.permissions.owner);
            }
            if(result)
                return result;

            _.each(safeGet(this.permissions, 'group', {}), function (groupData,groupName) {
                if(!result&&Roles.userIsInRole(userId,groupName)){
                    result = checkFullDoc(groupData);
                }
            });
            if(result)
                return result;
        }

        if(this.permissions.default)
            return checkFullDoc(this.permissions);
        return false;
    }

    checkRemove(userId,doc){
        var self = this;
        if(userId) {
            var userIdField = safeGet(this.permissions,'userIdField',null);
            if(userIdField && safeGet(this.permissions,'owner',false) && safeGet(doc,userIdField,null)==userId){
                var checkData = this.checkData(this.permissions.owner,'d');
                if(checkData.allowed)
                    return true;
            }
            var result = false;
            _.each(safeGet(this.permissions, 'group', {}), function (groupData,groupName) {
                if(!result&&Roles.userIsInRole(userId,groupName)){
                    var checkData = self.checkData(groupData,'d');
                    if(checkData.allowed)
                        result = true;
                }
            });
            if(result)
                return result;
        }

        if(this.permissions.default){
            var checkData = this.checkData(this.permissions.default,'d');
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
            var userIdField = safeGet(this.permissions,'userIdField',null);
            if(userIdField && safeGet(this.permissions,'owner',false) ){
                result.owner = getCondition(this.permissions.owner);
                if(result.owner.condition)
                    result.owner.condition[userIdField]=userId;
            }
            _.each(safeGet(this.permissions, 'group', {}), function (groupData,groupName) {
                if(Roles.userIsInRole(userId,groupName)){
                    result.group[groupName] = getCondition(groupData);
                }
            });
        }

        if(this.permissions.default)
            result.default = getCondition(this.permissions.default);
        return result;
    }
};

CollectionPermissions.DEFAULT = {
    'default':'rw'
};