import {_} from 'meteor/underscore';

MongoHelper = class MongoHelper{
    constructor(selector=undefined,options=undefined){
        this.$and = [];
        if(!_.isEmpty(selector))
            this.$and.push(selector);
        this._options = options;
    }

    withOptions(opts){
        if(!_.isEmpty(opts))
            return this;
        if(!this._options)
            this._options = {};
        this._options = _.extend(this._options,opts);
        return this;
    }

    withAnd(selector){
        if(!_.isEmpty(selector))
            this.$and.push(selector);
        return this;
    }

    seletor(){
        let size = _.size(this.$and);
        if(size==0)
            return {};
        if(size==1)
            return _.first(this.$and);
        return {$and:this.$and};
    }

    options(){
        if(!this._options)
            return undefined;
        return this._options;
    }

    /**
     * @param {Object} options
     * @param {Object} options.allow
     * @param {Object} options.disallow
     * */
    checkModifier($modifier,options){
        let $modKeys = _.chain($modifier)
            .keys()
            .filter((key)=>{
                ret
            })
    }
};