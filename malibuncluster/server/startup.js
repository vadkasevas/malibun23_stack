import {MalibunServers} from "../MalibunServers";

Meteor.afterStartup(function(){

    if(Cluster.isMaster()){
        var server = MalibunServers.current();
        if(server) {
            Meteor.setInterval(function () {
                server.update({ping_date:new Date()});
            }, 30000);
        }
    }

});