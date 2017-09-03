SchemaBuilder = class SchemaBuilder{

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
        return new SimpleSchema( this._defs );
    }

    get defs(){
        return _.extend({},this._defs);
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