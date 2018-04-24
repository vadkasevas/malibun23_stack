/**@name FieldResult
 * @property {boolean} isSet
 * @property {string} value
 * @property {string} operator
 * */

/**@name CustomValidateCtx
 * @property {string} key
 * @property {string} genericKey
 * @property {string} definition
 * @property {string} isSet
 * @property {string} value
 * @property {string} operator
 */
/**
 * @method
 * @name CustomValidateCtx#field
 * @param {string} fieldName
 * @returns {FieldResult}
 *
 */

Schemas = {};
Schemas.errors = {
    required:'required',
    minString:'minString',
    maxString:'maxString',
    minNumber:'minNumber',
    maxNumber:'maxNumber',
    minDate:'minDate',
    maxDate:'maxDate',
    badDate:'badDate',
    minCount:'minCount',
    maxCount:'maxCount',
    noDecimal:'noDecimal',
    notAllowed:'notAllowed',
    expectedString:'expectedString',
    expectedNumber:'expectedNumber',
    expectedBoolean:'expectedBoolean',
    expectedArray:'expectedArray',
    expectedObject:'expectedObject',
    expectedConstructor:'expectedConstructor',
    regEx:'regEx',
};

var addOptions = function(result,extOptions){
    extend(true,result,extOptions || {});
    return result;
};

Schemas.addOptions = function(result,extOptions){
    return addOptions(result,extOptions);
};

Schemas.autofill = function(options){
    options.optional = true;
    if(isset(options.defaultValue)) {
        var defaultValue = options.defaultValue;
        delete options.defaultValue;
        options.autoValue = function(){
            if(!this.isSet)
                return defaultValue;
        }
    }
    return options;
};

Schemas.String = function(label,extOptions){
    var result = {
        type:String,
        label:label,
        autoform: {
            style: "width: auto;"
        }
    };
    return addOptions(result,extOptions);
};

Schemas.textarea = function(label,extOptions){
    var result = {
        type:String,
        label:label,
    };
    result.autoform = result.autoform || {};
    result.autoform.rows = 10;
    result.autoform.cols = 20;
    return addOptions(result,extOptions);
};

Schemas.Number = function(label,extOptions){
    var result =  {
        type: Number,
        optional:false,
        label:label,
        autoform: {
            style: "width: auto;"
        }
    };
    return addOptions(result,extOptions);
};

Schemas.created = function(label,extOptions) {
    var result = {
        type: Date,
        label:label,
        optional:true,
        autoform: {
            style: "width: auto;",
            disabled: true,
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                timezoneId: "Europe/Moscow",
                dateTimePickerOptions:{
                    format: 'DD.MM.YY HH:mm:ss',
                    language: 'ru'
                }
            }
        },
        autoValue: function () {
            if (this.isInsert) {
                return new Date;
            } else if (this.isUpsert) {
                return {$setOnInsert: new Date};
            } else {
                this.unset();
            }
        }
    };
    return addOptions(result,extOptions);
};

Schemas.date = function(label,extOptions) {
    var result = {
        type: Date,
        label:label,
        autoform: {
            style: "width: auto;",
            afFieldInput: {
                type: "bootstrap-datetimepicker",
               // timezoneId: 'Africa/Abidjan',
                timezoneId: "Europe/Moscow",
                dateTimePickerOptions:{
                    format: 'DD.MM.YY HH:mm:ss',
                    language: 'ru'
                }
            }
        },
        optional: true
    };
    return addOptions(result,extOptions);
};

Schemas.updated = function(label,extOptions) {
    var result = {
        type: Date,
        label:label,
        autoform: {
            style: "width: auto;",
            disabled: true,
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions:{
                    format: 'DD.MM.YY HH:mm:ss',
                    language: 'ru'
                }
            }
        },
        autoValue: function () {
            if (this.isUpdate) {
                return new Date();
            }
            if (this.isInsert)
                return null;
        },
        optional: true
    };
    return addOptions(result,extOptions);
};

Schemas.objectId = {
    type:String,
    autoform: {
        type: "hidden",
        label: false,
    },
    autoValue: function() {
        if (!this.isSet) {
            return new Meteor.Collection.ObjectID()._str;
        }
    },
};

Schemas.objectIdVisible = {
    type:String,
    autoValue: function() {
        if (!this.isSet) {
            return new Meteor.Collection.ObjectID()._str;
        }
    }
};

Schemas.autocomplete = function(label,method,extOptions){
    var result = {
        type: String,
        label:label,
        autoform: {
            afFieldInput: {
                type: "universe-select",
                optionsMethod: method
            },
            style: "width: auto;"
        }
    };
    return addOptions(result,extOptions);
};

Schemas.namedAutoComplete = function(label,collection,fieldName,schemaOptions,options){
    fieldName = fieldName || 'name';
    var getCollection = function(){
        if(typeof collection=='string')
            return global[collection];
        else
            return collection;
    };
    var methodName = (typeof collection=='string') ? `${collection}namedAutoComplete` : `${collection._name}namedAutoComplete`;
    if(safeGet(options,'multiple',false)){
        methodName+='Multiple';
    }
    var limit = safeGet(options,'limit',0);
    if(limit){
        methodName+=`Limit${limit}`;
    }
    var methodFunction = null;
    if(_.isString(safeGet(options,'method',methodName) )){
        methodName = safeGet(options,'method',methodName);
    }else{
        methodFunction = safeGet(options,'method',null);
    }

    methodName = safeGet(options,'method',methodName);
    var transform = safeGet(options,'transform',function (model) {
        return {label: safeGet( model,fieldName,''), value: model._id};
    });

    if(Meteor.isServer){
        if(!isset(Meteor.default_server.method_handlers[methodName])) {
            var method = {};
            method[methodName] = methodFunction || function (options) {
                this.unblock();
                var findOptions = limit ? {limit:limit} : {};
                var condition = options.searchText ? {$or : [{ [fieldName]: {$regex:new RegExp(options.searchText, "i") }} ] } : {};
                //console.log(condition);
                if(options.values&&options.values.length>0) {
                    condition.$or = condition.$or || [];
                    condition.$or.push( { _id:{ $in: options.values} } );
                    if(limit)
                        findOptions = {limit:limit+options.values.length};
                }

                var collection = getCollection();
                var cursor = (collection instanceof MalibunCollection && !Meteor.isAdmin() ) ?
                     collection.publishCursor( Meteor.currentUser(), condition, options )
                    :collection.find(condition,findOptions);

                return cursor.fetch().map(function (model) {
                    return transform(model);
                });
            };
            Meteor.methods(method);
        }
    }
    var result = Schemas.autocomplete(label,methodName,schemaOptions);
    if(safeGet(options,'multiple',false)){
        result.type = [String];
        result.autoform.afFieldInput.multiple=true;
        result.autoform.afFieldInput.rows = 10;
        result.autoform.rows = 10;
        result.autoform.afQuickField = result.autoform.afFieldInput;
    }

    return result;
};

Schemas.EXISTS_SCHEMA_NOMATTER = 0;
Schemas.EXISTS_SCHEMA_NOT_EXISTS = 2;
Schemas.EXISTS_SCHEMA_EXISTS = 1;
Schemas.existsSchema = function(label){
    return {
        type: Number, allowedValues:[Schemas.EXISTS_SCHEMA_NOMATTER,Schemas.EXISTS_SCHEMA_EXISTS,Schemas.EXISTS_SCHEMA_NOT_EXISTS],
        defaultValue:Schemas.EXISTS_SCHEMA_NOMATTER,
        optional:true,
        label: label,
        autoform: {
            options: [
                {
                    label: "Не важно",
                    value: Schemas.EXISTS_SCHEMA_NOMATTER,
                },
                {
                    label: "Да",
                    value: Schemas.EXISTS_SCHEMA_EXISTS,
                },
                {
                    label: "Нет",
                    value: Schemas.EXISTS_SCHEMA_NOT_EXISTS,
                }
            ]
        }
    };
};

Schemas.UUID = {
    type:String,
    autoform: {
        type: "hidden",
        label: false,
    },
    autoValue: function() {
        if (this.isInsert && !this.isSet) {
            if(Meteor.isServer){
                return UUID.v4();
            }else{
                return Meteor.call('uuid');
            }
        }
    }
};


Schemas.Date = function(label,extOptions){
    var result = {
        type: Date,
        label:label,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions:{
                    format: 'DD.MM.YY HH:mm',
                    language: 'ru'
                }
            }
        }
    };
    addOptions(result,extOptions);
    return result;
};

var schemaMessage = function(msg){
    var key = md5(msg);
    SimpleSchema.messages({
        [key]:msg
    });
    return key;
};

var esprm = Meteor.isServer ? Npm.require('esprima') : esprima;

Schemas.esCode = function(extOptions){
    var result = {
        type:String,
        autoform:{cols:10,rows:10,type:'code'},
        custom(){
            var esCode = this.value;
            if(!esCode)
                return false;

            try{
                esprm.parseScript(esCode,{tolerant:true});
                return true;
            }catch(e){
                return schemaMessage(e.message);
            }
        }
    };
    return addOptions(result,extOptions);
}

