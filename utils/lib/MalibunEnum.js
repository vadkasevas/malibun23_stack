/**
 * Класс перечисления
 * */
MalibunEnum = class MalibunEnum{

    constructor(_data){
        var data = [];
        if(_.isArray(_data)){
            data = _data;
        }else{
            _.each(_data,function(label,key){
                data.push({key:key,label:label});
            });
        }
        var self = this;
        var keys = [];
        _.each(data,(d)=>{
            var item = new MalibunEnumItem(d.key,d.label);
            Object.defineProperty(self, item.key, {
                get: function() { return item; },
                enumerable: true,
                configurable: false
            });
            keys.push(d.key);
        });

        Object.defineProperty(self, 'keys', {
            get: function() { return keys.slice(); },
            enumerable: false,
            configurable: false
        });

        Object.defineProperty(self, 'data', {
            get: function() {
                return data;
            },
            enumerable: false,
            configurable: false
        });
    }

    /**
     * Преобразует перечисление в схему SimpleSchema
     * */
    toSimpleSchema(extOptions){
        var schema = {
            type:String,
            allowedValues:this.keys,
            autoform:{
                options:this.keys.map((key)=>{
                    return {label: this[key].label,value:key};
                })
            }
        };
        return Schemas.addOptions(schema,extOptions);
    }

    /**
     * Первый элемент перечисления
     * @returns {MalibunEnumItem}
     * */
    first(){
        if(this.keys.length>0) {
            var result = this[this.keys[0]];
            return result;
        }
    }

    /**
     * Возвращает новый объект перечисления за исключением переданного ключа или ключей
     * @param {string|string[]} keys Исключаемые ключи или ключ
     * @returns {MalibunEnum}
     * */
    exclude(keys){
        if(!_.isArray(keys))
            keys = [String(keys)];
        var self = this;
        var data = _.filter(this.keys,(key)=>{return keys.indexOf(key)==-1})
            .map(function(key){ return {key:key,label:self[key].label} });
        return new MalibunEnum(data);
    }

};

/**
 * Элементы перечисления
 * */
MalibunEnumItem = class MalibunEnumItem{

    constructor(key,label){
        this._key = key;
        this._label = label;
    }

    /**
     * Ключ
     * @returns {string}
     * */
    get key(){
        return this._key;
    }

    /**Отображаемый текст*/
    get label(){
        return this._label;
    }

    valueOf(){
        return this.key;
    }

    toString(){
        return this.key;
    }

};