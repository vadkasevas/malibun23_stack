Template.registerHelper('formatRuDateTime', formatRuDateTime);
Template.registerHelper('formatRuDateTimeMS', formatRuDateTimeMS);

Template.registerHelper('alert', function (obj) {
    alert(  stringify(obj) );
});

Template.registerHelper('console', function (obj) {
    console.log(  stringify(obj) );
});

Template.registerHelper('set', function (name,obj) {
    Session.set(name,obj);
});

Template.registerHelper('get', function (name) {
    return Session.get(name);
});

Template.registerHelper('log', function () {
    return console.log.apply(console,arguments);
});

Template.registerHelper('ruBoolean', formatRuBoolean);

Template.registerHelper('audio',function(){
    $('div[class*="mejs-container"]').remove();
    $('audio').mediaelementplayer({success: function(mediaElement, originalNode) {
        // do things
    }});
});

Template.registerHelper('malibunLabel' , function(key) {
        var name = capitalize( Template.instance().view.name.replace('Template.','') );
        var cname = name.replace( /[A-Z_][a-z0-9]+$/g ,'');
        //console.log('collectionname:',cname);
        return window[cname].schema.label(key);
    }
);

Template.registerHelper('window',function(){
    return window;
});

Template.registerHelper('MalibunAction',function(){
    return MalibunAction;
});

var concat = function(){
    var result = '';
    _.each(clearHelperArguments(arguments),function(arg){
        //console.log('arg:',arg);
        result+=arg;
    });
    return result;
};
Template.registerHelper('concat',concat);

Template.registerHelper('or',function(arg1,arg2){
    return _.some(clearHelperArguments(arguments), function(el){return typeof el!='undefined'&&el;});
});

Template.registerHelper('not',function(arg1){
    return !arg1;
});

Template.registerHelper('equals',function(arg1,arg2){
    return arg1==arg2;
});

Template.registerHelper('notEquals',function(arg1,arg2){
    return arg1!=arg2;
});

Template.registerHelper('parentData',function(n){
    return Template.parentData(n);
});

Template.registerHelper('safeGet',function(){
    var args = clearHelperArguments(arguments);
    var obj = args[0];
    var key = args[1];
    var defaultValue = args[2] || undefined;
    return safeGet(obj,key,defaultValue);
});

Template.registerHelper('formType',function(){
    console.log('MalibunAction.data:',MalibunAction.data);
    return safeGet(MalibunAction,'data.formType',null);
});

PrimitiveContainer = class PrimitiveContainer{
    constructor(value){
        this.value = value;
    }

    toJSON(){
        return this.toString();
    }

    toString(){
        return String( this.value );
    }
};

var getMalibunProxy=function(template,args,){
    args = args || [];

    var proxy = new Proxy(template, {
        get: function(target, name) {
            var value = target[name];

            if(name=='$concat'){
                return function(){
                    return concat.apply( null,args.concat( _.toArray(arguments) ) );
                }
            }
            //console.log('proxy targer:',target,' name:',name,'value',value);
            if(typeof value === 'function') {
                value = value.bind(target);
                return value;
            }else if(typeof value=='object'){
                return getMalibunProxy(value);
            }else/* if(typeof value=='string'||typeof value=='number')*/{
                return getMalibunProxy(new PrimitiveContainer(value),[value]);
            }
        },
    });
    return proxy;
};
/*
Template.registerHelper('window',function(){
    return getMalibunProxy(window);
});*/

Template.registerHelper('self',function(){
    return getMalibunProxy(this);
});


Template.registerHelper('getRoute',function(){
    return MalibunController.current.getRoute.apply(MalibunController.current,clearHelperArguments(arguments));
});

Template.registerHelper('getTemplate',function(){
    return MalibunController.current.getTemplate.apply(MalibunController.current,clearHelperArguments(arguments));
});

Template.registerHelper('parse',function(json){
    return JSON.parse(json);
});

