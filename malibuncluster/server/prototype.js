Object.defineProperty(MalibunServersModel.prototype, "serverConfigs", {
    get: function serverConfigs() {
        return ServerConfigs.find({server_id:this._id}).fetch();
    }
});

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