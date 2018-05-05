import {MalibunCollection,MalibunModel} from "../utils/mongo/MalibunCollection";
import {MalibunServerGroups} from './MalibunServerGroups';
/**
 * @property {string} name
 * @property {boolean} master
 * @property {string} version
 * @property {date} ping_date
 * @property {number} workers_count
 * @property {string} real_url
 * @property {string} group_id
 **/
export class MalibunServersModel extends MalibunModel{
    /**@returns {ServerConfigsModel[]}*/
    get serverConfigs(){
        return ServerConfigs.find({server_id:this._id}).fetch();
    }
}

var MalibunServers = new MalibunCollection('malibunServers',{
    modelClass:MalibunServersModel,
    permissions:{
        group:{
            [Roles.ROLE_ADMIN]:'rw'
        }
    },
    MONGO_URL : Meteor.isServer&&process.env.SHARED_MONGO_URL ? process.env.SHARED_MONGO_URL : null
});

MalibunServers.connections = {};

MalibunServers.schemaDef = {
    name:{type:String,label:'Имя',unique:true},
    group_id:Schemas.namedAutoComplete('Группа серверов',MalibunServerGroups,'name'),
    master:{type:Boolean,optional:true,defaultValue:false,label:'Мастер?'},
    version:{type:String,label:'Текущая версия',optional:true,defaultValue:null},
    ping_date:{type:Date,optional:true,defaultValue:null,label:'Дата активности'},
    workers_count:{type:Number,label:'Кол-во потоков',optional:true,defaultValue:null},
    real_url:{type:String,label:'URL'},

    available:{type:Number,optional:true,defaultValue:null,label:'Доступно'},
    free:{type:Number,optional:true,defaultValue:null,label:'Свободно'},
    total:{type:Number,optional:true,defaultValue:null,label:'Всего'},
};
MalibunServers.schema = new SimpleSchema(MalibunServers.schemaDef);

var currentServer = null;
MalibunServers.current = function(cb){
    var MALIBUN_SERVER_ID = process.env.MALIBUN_SERVER_ID || null;
    var MALIBUN_SERVER_NAME = process.env.MALIBUN_SERVER_NAME || null;

    //console.log('MALIBUN_SERVER_ID',MALIBUN_SERVER_ID,'MALIBUN_SERVER_NAME:',MALIBUN_SERVER_NAME);
    var condition = {
        $or:[
            {_id:MALIBUN_SERVER_ID},
            {name:MALIBUN_SERVER_NAME}
        ]
    };
    //console.log(condition);
    if (MALIBUN_SERVER_ID || MALIBUN_SERVER_NAME ) {
        currentServer = currentServer || MalibunServers.findOne(condition);

        if(cb){
            if(currentServer)
                cb(currentServer);
        }
        return currentServer;
    }
};
MalibunServers.isMaster = function(){
    return safeGet( MalibunServers.current(),'master' )
};
export {MalibunServers};