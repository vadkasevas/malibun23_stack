clearHelperArguments = function(args){
    return _.filter( _.toArray(args) , function(arg){
        return !safeGet(arg,'hash');
    });
};

combineClasses = (baseClass, ...mixins) => {
    let base = class _Combined extends baseClass {
        constructor (...args) {
            super(...args)
            mixins.forEach((mixin) => {
                mixin.prototype.initializer.call(this)
            })
        }
    };
    let copyProps = (target, source) => {
        Object.getOwnPropertyNames(source)
            .concat(Object.getOwnPropertySymbols(source))
            .forEach((prop) => {
                if (prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/))
                    return
                Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop))
            })
    };
    mixins.forEach((mixin) => {
        copyProps(base.prototype, mixin.prototype)
        copyProps(base, mixin)
    });
    return base
};

if(Meteor.isServer){
    var _extend = Npm.require('node.extend');
    extend = function(deep,target,source){
        if(deep)
            return _extend(true, target, source);
        else
            return _extend(target, source);
    };
    UUID = Npm.require('node-uuid');
}else{
    extend = function(deep,target,source){
        if(deep)
            return $.extend(true,target,source);
        else
            return $.extend(target, source);
    }
}

md5 = function(s){
    return CryptoJS.MD5(String(s)).toString();
};

getRandHash = function(){
    return md5( new Meteor.Collection.ObjectID()._str+Date.now() );
};

stringify = function(obj){
    var seen = [];
    return JSON.stringify(obj, function(key, val) {
        if (typeof val == "object") {
            if (seen.indexOf(val) >= 0)
                return
            seen.push(val)
        }
        return val;
    });
};

inArray = function(arr,needle){
    return arr.indexOf(needle)>-1;
};

isset = function(obj){
    return obj===null || typeof(obj)!=='undefined';
};

randKey = function(object){
    var keys = [];
    for(var key in object){
        keys.push(key);
    }
    if(keys.length>0){
        return  keys[Math.floor(Math.random() * keys.length)];
    }else
        return null;
};

randValue = function(object){
    var _randKey = randKey(object);
    if(_randKey&&typeof (object[_randKey]) !='undefined'){
        return object[_randKey];
    }
    return null;
};

eachObjectField = function(obj,callback){
    for(var field in obj){
        callback(obj[field],field);
    }
};

generateRandomHash = function() {
    return md5(rndInt(100000000) + '_' + rndInt(100000000) + '_' + new Date().getTime() );
};

formatRuBoolean = function (val) {
    if(val)
        return 'Да';
    else
        return 'Нет';
};

safeGet = function safeGet (obj, props, defaultValue) {
    if (obj === undefined || obj === null) {
        return defaultValue;
    }
    if(typeof props=='string'){
        props = props.split('.');
    }else if(!Array.isArray(props)){
        if(isset(obj[props]))
            return obj[props];
        else
            return defaultValue;
    }

    if (!props||props.length === 0) {
        return obj;
    }
    var foundSoFar = obj[props[0]];
    var remainingProps = props.slice(1);

    return safeGet(foundSoFar, remainingProps, defaultValue);
};

Object.equals = function( x, y ) {
    if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

    //if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for ( var p in x ) {
        if ( ! x.hasOwnProperty( p ) ) continue;
        // other properties were tested using x.constructor === y.constructor

        if ( ! y.hasOwnProperty( p ) ) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if ( x[ p ] === y[ p ] ) continue;
        // if they have the same strict value or identity then they are equal

        if ( typeof( x[ p ] ) !== "object" ) return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
        // Objects and Arrays must be tested recursively
    }

    for ( p in y ) {
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
        // allows x[ p ] to be set to undefined
    }
    return true;
};

deserializeDate = function(dateS){
    if (typeof dateS === 'string') {
        var a = deserializeDate.reISO.exec(dateS);
        if (a) {
            return new Date(dateS);
        }
    }
    return dateS;
};
deserializeDate.reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

deserializeDates = function(obj){
    if(obj instanceof Date)
        return obj;

    if(Array.isArray(obj)){
        var clone = [];
        _.each(obj,function(val,index){
            clone[index] =  deserializeDates(val);
        });
        return clone;
    }else if(typeof obj === 'string'){
        return deserializeDate(obj);
    }
    else if( (obj instanceof Object) ) {
        var clone = {};
        for (var key in obj) {
            clone[key] = deserializeDates(obj[key]);
        }
        return clone;
    }
    return obj;
};

keyValueChunks = function(objOrArray,key,size){
    size = size || 10;
    var result = [];
    if(Array.isArray(objOrArray)){
        for (var i = 0, j = objOrArray.length; i < j; i += size) {
            var chunk = objOrArray.slice(i, i + size);
            var assockChunk = {};
            _.each(chunk,function(item){
                assockChunk[item[key]] = item;
            });
            result.push(assockChunk);
        }
    }else{
        var assockChunk = {};
        for(var propKey in objOrArray){
            assockChunk[objOrArray[propKey][key]] = objOrArray[propKey];
            if(_.size(assockChunk)>=size){
                result.push(assockChunk);
                assockChunk = {};
            }
        }
        if(_.size(assockChunk)>0&&_.size(assockChunk)<size){
            result.push(assockChunk);
        }
    }
    return result;
};


filterArray = function(arr,filter){
    var result = [];
    _.each(arr,function(element){
        if(
            (filter&&filter(element))
            ||(!!element)
        ){
            result.push(element);
        }
    });
    return result;
};

minValue = function(object){
    if(!(object))
        return undefined;

    var arr = Object.keys( object ).map(function ( key ) { return Number( obj[key] ); });
    return Math.min(arr);
};

minKey = function(object){
    if(object) {
        var keys = Object.keys( object ).map(function ( key ) { return Number( key ); });
        if (keys.length > 0) {
            return Math.min.apply(null, keys);
        }
    }
    return undefined;
};

keyValueChunks = function(objOrArray,key,size){
    size = size || 10;
    var result = [];
    if(Array.isArray(objOrArray)){
        for (var i = 0, j = objOrArray.length; i < j; i += size) {
            var chunk = objOrArray.slice(i, i + size);
            var assockChunk = {};
            _.each(chunk,function(item){
                assockChunk[item[key]] = item;
            });
            result.push(assockChunk);
        }
    }else{
        var assockChunk = {};
        for(var propKey in objOrArray){
            assockChunk[objOrArray[propKey][key]] = objOrArray[propKey];
            if(_.size(assockChunk)>=size){
                result.push(assockChunk);
                assockChunk = {};
            }
        }
        if(_.size(assockChunk)>0&&_.size(assockChunk)<size){
            result.push(assockChunk);
        }
    }
    return result;
};

joinObject = function(object, glue, separator) {
    glue = glue || ':';
    separator = separator || "\n";
    return Object.getOwnPropertyNames(object).map(
        function(k) { return [k, object[k]].join(glue) }
    ).join(separator);
};

JSON.prettystringify = function(obj){
    return JSON.stringify(obj, null, '\t');
};