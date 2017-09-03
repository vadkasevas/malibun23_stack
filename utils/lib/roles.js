Roles.ROLE_ADMIN = 'admin';
Roles.ROLE_COMPANY = 'company';
Roles.ROLE_GUEST = 'guest';

var userIsInRole = function(userId,role){
    return (Roles.userIsInRole(userId, [role], Roles.GLOBAL_GROUP));
};
Meteor.userIsInRole = userIsInRole;
Meteor.userIdIsAdmin = function(userId){
    return userIsInRole(userId,Roles.ROLE_ADMIN);
};

Meteor.userIdIsCompany = function(userId){
    return userIsInRole(userId,Roles.ROLE_COMPANY);
};

Meteor.isAdmin = function(){
    return userIsInRole( Meteor.userId() , Roles.ROLE_ADMIN );
};

Meteor.isCompany = function(){
    return userIsInRole( Meteor.userId() , Roles.ROLE_COMPANY );
};
