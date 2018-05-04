import { Match } from 'meteor/check'

var schemaDefinition = {                                                                                               // 6
    type: Match.Any,                                                                                                     // 7
    label: Match.Optional(Match.OneOf(String, Function)),                                                                // 8
    optional: Match.Optional(Match.OneOf(Boolean, Function)),                                                            // 9
    min: Match.Optional(Match.OneOf(Number, Date, Function)),                                                            // 10
    max: Match.Optional(Match.OneOf(Number, Date, Function)),                                                            // 11
    minCount: Match.Optional(Match.OneOf(Number, Function)),                                                             // 12
    maxCount: Match.Optional(Match.OneOf(Number, Function)),                                                             // 13
    allowedValues: Match.Optional(Match.OneOf([Match.Any], Function)),                                                   // 14
    decimal: Match.Optional(Boolean),                                                                                    // 15
    exclusiveMax: Match.Optional(Boolean),                                                                               // 16
    exclusiveMin: Match.Optional(Boolean),                                                                               // 17
    regEx: Match.Optional(Match.OneOf(RegExp, [RegExp])),                                                                // 18
    custom: Match.Optional(Function),                                                                                    // 19
    blackbox: Match.Optional(Boolean),                                                                                   // 20
    autoValue: Match.Optional(Function),                                                                                 // 21
    defaultValue: Match.Optional(Match.Any),                                                                             // 22
    trim: Match.Optional(Boolean)                                                                                        // 23
};

@component
class SchemaBuilder{

    constructor(schema){
        this._defs = {};
        if(schema)
            this.inject('',schema);
    }

    /**@returns SchemaBuilder */
    inject(key,schema){
        if(!schema) {
            schema = key;
            key = null;
        }
        if(schema instanceof SimpleSchema){
            this.inject(key,schema._schema);
        }else{
            var self = this;
            _.each(schema,function(fieldDef,fieldName){
                var fullKey = key ? `${key}.${fieldName}` : fieldName;
                self._defs[fullKey] = fieldDef;
            });
        }
        return this;
    }

    /**@returns SimpleSchema */
    build(){
        return new SimpleSchema( this.defs );
    }

    get defs(){
        var result = {};
        _.each(this._defs,(def,key)=>{
            //if (Match.test(def, schemaDefinition)) {                                                                   // 456
                result[key]=this._defs[key];                                            // 457
            //}
        });
        return result;
    }

    /**@returns SchemaBuilder */
    exclude(keys){
        if(!_.isArray(keys))
            keys = [keys];
        var data = {};
        _.each(this.defs,function(val,key){
            if(keys.indexOf(key)==-1)
                data[key] = val;
        });
        return new SchemaBuilder(data);
    }


};