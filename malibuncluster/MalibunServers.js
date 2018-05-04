/**
 * @property {string} name
 * @property {boolean} master
 * @property {string} version
 * @property {date} ping_date
 * @property {number} workers_count
 * @property {string} real_url
 * @property {string} group_id
 **/
@component
class MalibunServersModel extends MalibunModel{
    /**@returns {ServerConfigsModel[]}*/
    get serverConfigs(){
        return ServerConfigs.find({server_id:this._id}).fetch();
    }
};

MalibunServers = new MalibunCollection('malibunServers',{
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
