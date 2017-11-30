Template.registerHelper('currentServerName', function () {
    return Meteor.settings.public.MALIBUN_SERVER_NAME || '<Не задан>';
});

Template.registerHelper('currentServerId', function () {
    return Meteor.settings.public.MALIBUN_SERVER_ID || '<Не задан>';
});

