import {MalibunCollection,MalibunModel} from "../utils/mongo/MalibunCollection";
import {MalibunServers} from "./MalibunServers";

/**
 * @property {string}
 * */
export class MalibunServerGroupsModel extends MalibunModel{
    /**@returns {MalibunServersModel[]}*/
    get servers(){
        return MalibunServers.find({group_id:this._id}).fetch();
    }
};

var MalibunServerGroups = new MalibunCollection('malibunServerGroups',{
    modelClass:MalibunServerGroupsModel,
    permissions:{
        group:{
            [Roles.ROLE_ADMIN]:'rw'
        }
    },
    MONGO_URL : Meteor.isServer&&process.env.SHARED_MONGO_URL ? process.env.SHARED_MONGO_URL : null
});

/**
 * @method
 * @name MalibunServerGroups#findOne
 * @param {object} selector - <p>A query describing the documents to find</p>
 * @returns MalibunServerGroupsModel
 */

var def = {
    name:{type:String,label:'Имя',unique:true},
    isDefault:{type:Boolean,optional:true,defaultValue:false,label:'По умолчанию (сюда автоматически добавляются юзеры в момент создания аккаунта)'}
}
MalibunServerGroups.schema = new SimpleSchema(def);

export {MalibunServerGroups};