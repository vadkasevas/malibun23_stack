import {_} from 'meteor/underscore';

MongoValidator = class MongoValidator {
    constructor(){
        this.fieldsAllow = null;
        this.fieldsDisallow = null;
    }

    withFieldsAllow(fields){
        if(!_.isEmpty(fields)){
            this.fieldsAllow = this.fieldsAllow || [];
            _.each(fields,(field)=>{
                this.fieldsAllow.push(field);
            });
        }
        return this;
    }

    withFieldsDisallow(fields){
        if(!_.isEmpty(fields)){
            this.fieldsDisallow = this.fieldsDisallow || [];
            _.each(fields,(field)=>{
                this.fieldsDisallow.push(field);
            });
        }
        return this;
    }

    contains(definedField,$modifierField){
        let definedSplitten = definedField.split('.');
        let $modifierSplitten = $modifierField.split('.');
        var result = true;
        _.each( definedSplitten ,(definedSubField,index)=>{
            if($modifierSplitten[index]!==definedSubField)
                result = false;
        });
        return result;
    }

    isOperator(key){
        return key && String(key).indexOf('$')==0;
    }
    isAllowed($modifierField){
        if(!_.isEmpty(this.fieldsAllow)){
            let allowed = _.chain( this.fieldsAllow )
                .find((allowedField)=>{
                    return this.contains( allowedField , $modifierField );
                })
                .value();
            return !!allowed;
        }
        if(!_.isEmpty(this.fieldsDisallow)){
            let disallowed = _.chain( this.fieldsDisallow )
                .find((disallowedField)=>{
                    return this.contains( disallowedField , $modifierField );
                })
                .value();
            return !disallowed;
        }
        return true;
    }


    validate($modifier){

        const iterate = (value,key)=>{
            if(!this.isOperator(key)){
                if(!this.isAllowed(key))
                    throw new Error(`Запрещено изменение поля ${key}`);
            }else if(_.isObject(value)&&!_.isArray(value)){
                _.each(value,iterate);
            }
        }

        _.each($modifier,iterate);
        return true;

    }




}