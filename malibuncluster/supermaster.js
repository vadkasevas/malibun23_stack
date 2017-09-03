supermasterConnection = process.env.SUPERMASTER_URL ? DDP.connect( process.env.SUPERMASTER_URL
        ,{
            onConnected:function(){
                console.log('SUPERMASTER_URL CONNECTED!!!!');
                supermasterConnection.call("login", {
                        "password":{digest: '01c5bc3771f5a4741c3a0a8b7264f433b5f98a87590c3ce55a18ea4312abe084', algorithm: 'sha-256' },
                        "user" : {
                            "username":'Система'
                        }
                    },
                    function(err,result) {
                        supermasterConnection.subscribe('malibunServers');
                        supermasterConnection.subscribe('clusterUsers');
                        supermasterConnection.subscribe('malibunServerGroups');
                    }
                );

            },
            onDDPVersionNegotiationFailure(){
                console.log(arguments);
            }
        }
) : null;

if(!supermasterConnection){
    Meteor.startup(function(){
        if( Meteor.users.find({'roles.__global_roles__':{$in:[Roles.ROLE_SYSTEM]}}).count() == 0 ){
            var userIn = {
                username: 'Система'
            };
            var user_id = Accounts.insertUserDoc(
                {profile: {name: 'Система'}},
                userIn
            );
            Accounts.setPassword(user_id, 'kldkljfskldjfksdnjvuisodrereedaasddwwfe');
            Roles.addUsersToRoles(user_id, Roles.ROLE_SYSTEM , Roles.GLOBAL_GROUP);
        }
    });
}

if(supermasterConnection){
    Meteor.users = new Meteor.Collection('users',{connection:supermasterConnection});
    Meteor.users._connection = supermasterConnection;
    Accounts.connection= supermasterConnection;
}
