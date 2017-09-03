if(Meteor.isServer){
    var url = Npm.require('url');
    Meteor.settings.public.ROOT_URL = process.env.ROOT_URL;
    Meteor.settings.public.hostname = url.parse(process.env.ROOT_URL).hostname;
    Meteor.settings.public.port = url.parse(process.env.ROOT_URL).port || 80;
}
Meteor.hostname = function(){
    return Meteor.settings.public.hostname;
};
Meteor.port = function(){
    return Meteor.settings.public.port;
};
