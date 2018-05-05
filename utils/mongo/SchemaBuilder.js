import { Match } from 'meteor/check'

export class SchemaBuilder{

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