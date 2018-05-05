var action = function(target, key, descriptor) {
    descriptor.writable = false;
    target.actions = target.actions || ['actionIndex','actionCreate','actionUpdate','actionView'];
    if(target.actions.indexOf(key)==-1){
        target.actions.push(key);
    }
    return descriptor;
};
export {action};
/**
 * @property {MalibunCollection} collection - коллекция
 */

export class MalibunController{
    constructor(collection){
        this.collection = collection;
        this.actions = this.actions || ['actionIndex','actionCreate','actionUpdate','actionView'];
    }
    get name(){
        return this.collection._name;
    }
    getTemplate(action){
        if(typeof action=='function'){
            action = action.name;
            action = action.replace(/^action/gi,'');
        }
        action = capitalize(action);
        return this.name+action;
    }

    getRoute(action,urlParams){
        if(typeof action=='function'){
            action = action.name;
            action = action.replace(/^action/gi,'');
        }
        action = firstLower(action);
        urlParams = _.isArray(urlParams) ? urlParams : clearHelperArguments( _.toArray(arguments).slice(1) );

        var route = urlParams.length>0 ? `/${this.name}/${action}/`+urlParams.join('/') : `/${this.name}/${action}`;
        return route;
    }

    init(){
        var controller = this;
        _.each(this.actions,(actionName)=>{
            var f = this[actionName];
            if(f&&typeof f=='function') {
                var action = f.apply(controller);
                if (action && action instanceof MalibunController.MalibunAction) {
                    action.controller = controller;
                    if (Meteor.isServer) {
                        if (action.methods) {
                            Meteor.methods(action.methods);
                        }
                    }
                    // console.log(action.route,action.serialize());
                    Router.route(action.route, action.serialize());
                    if (Meteor.isClient) {
                        if (action.hooks)
                            AutoForm.hooks(action.hooks);

                        if (action.events) {
                            for (var templateName in action.events) {
                                Template[templateName].events(action.events[templateName]);
                            }
                        }

                        if (action.helpers) {
                            _.each(action.helpers, function (_helpers, templateName) {
                                Template[templateName].helpers(_helpers);
                            });
                        }
                    }
                }
            }
        });



    }
    /** @returns {MalibunController.MalibunAction}*/

    actionIndex(){
        var controller = this;
        var template = this.getTemplate('index');

        return new MalibunController.MalibunAction({
            route:this.getRoute('index'),
            name:template,
            template:template,
            parent:'index',
            waitOn:function(){
                return [ controller.collection.subscribe({}) ]
            },
            data:function(){
                var models = controller.collection.find({});
                return {models:models};
            },
            title:function(data){
                return `Просмотр моделей `;
            }
        });
    }

    /** @returns {MalibunController.MalibunAction}*/

    actionView(){
        var controller = this;
        var template = this.getTemplate('view');
        return new MalibunController.MalibunAction({
            route:this.getRoute('view',[':_id']),
            template:template,
            parent:this.getTemplate('index'),
            waitOn:function(){
                return [ controller.collection.subscribe({_id:this.params._id}) ]
            },
            data:function(){
                var model = controller.collection.findOne({_id:this.params._id});
                this.params.name = (model) ? model.name : '';
                return {model:model};
            },
            title:function(data){
                return `Просмотр модели "{model.name}"`;
            }
        });
    }

    /** @returns {MalibunController.MalibunAction}*/
    actionUpdate(){
        var controller = this;
        var template = this.getTemplate('update');
        return new MalibunController.MalibunAction({
            route:this.getRoute('update',[':_id']),
            template:template,
            parent:this.getTemplate('index'),
            name:template,
            waitOn:function(){
                return [ controller.collection.subscribe({_id:this.params._id}) ]
            },
            data:function(){
                var model = controller.collection.findOne({_id:this.params._id});
                this.params.name = (model) ? model.name : '';
                return {model:model};
            },
            title:`Изменить модель "{model.name}"`
        });
    }

    /** @returns {MalibunController.MalibunAction}*/
    actionCreate(){
        var controller = this;
        var template = this.getTemplate('create');
        return new MalibunController.MalibunAction({
            route:this.getRoute('create'),
            template:template,
            parent:this.getTemplate('index'),
            name:template,
            waitOn:function(){
                return [  ]
            },
            data:function(){
                return {};
            },
            title:function(data){
                return `Создать новый ${controller.collection._name}`;
            }
        });
    }



};

MalibunController.MalibunAction = class MalibunAction{
    constructor(opts) {
        this.extends(opts);
    }

    extends(newOpts){
        var action = this;
        if(newOpts.route)
            this.route = newOpts.route;
        if(newOpts.template)
            this.template = newOpts.template;
        if(isset(newOpts.parent))
            this.parent = newOpts.parent;
        if(newOpts.waitOn) {
            if(_.isArray(newOpts.waitOn))
                this.waitOn = function(){ return newOpts.waitOn };
            else
                this.waitOn = newOpts.waitOn;
        }
        if(newOpts.data)
            this.data = newOpts.data;
        if(newOpts.name)
            this.name = newOpts.name;
        if(newOpts.hooks)
            this.hooks = newOpts.hooks;
        if(newOpts.events)
            this.events = newOpts.events;
        if(newOpts.helpers)
            this.helpers = newOpts.helpers;
        if(newOpts.methods)
            this.methods = newOpts.methods;
        if(newOpts.onBeforeAction)
            this.onBeforeAction = newOpts.onBeforeAction;
        if(newOpts.rendered&&Meteor.isClient){
            Template[action.template].onRendered(newOpts.rendered);
        }

        if(newOpts.title) {
            this.title = function(){
                this.router.options.noCaps = true;
                var data = this.data();
                var result = _.isString(newOpts.title) ? newOpts.title:newOpts.title.apply(this,[data]);
                var tmpResult = result;
                var params = this.params;
                var matches;
                var re = /:([^\s"',;:]+)|\{([^\}]+)\}/gi;
                while ((matches = re.exec(result)) != null){
                    var replacement = matches[0];
                    var search = matches[1] || matches[2];
                    var val = safeGet(params,search,safeGet(data,search,''));
                    if(val)
                        tmpResult = tmpResult.replace(new RegExp(replacement, 'g'), val );
                }
                return tmpResult;
            };
        }

        if(newOpts.onAfterAction)
            this._onAfterAction = newOpts.onAfterAction;

        if(this.title||this._onAfterAction) {
            this.onAfterAction = function () {
                if (action.title) {
                    var title =  MalibunController.MalibunAction.baseTitle+ action.title.apply(this) ;

                    Meteor.startup(function(){
                        Deps.autorun(function () {
                            document.title = title;
                        });
                    });
                }
                if (action._onAfterAction) {
                    action._onAfterAction.apply(this);
                }
            };
        }


        return this;
    }

    serialize(){
        var self = this;
        var result = {};
        if(this.template)
            result.template = this.template;
        if(this.parent)
            result.parent = this.parent;
        if(this.waitOn){
            var waitOn = _.isArray(this.waitOn) ? ()=>{return this.waitOn;} : this.waitOn;
            result.waitOn = waitOn;
        }
        if(this.data)
            result.data = function(){
                var data = self.data.apply(this,arguments);
                if(MalibunAction.data) {
                    _.each(data, function (val, key) {
                        MalibunAction.data[key] = val;
                        MalibunAction.data[`${key}Reactive`] = new ReactiveVar(val);
                    });
                }
                return data;
            }
        if(this.name)
            result.name = this.name;

        if(this.onAfterAction)
            result.onAfterAction = this.onAfterAction;
        if(this.title)
            result.title = this.title;
        result.noCaps = true;
        if(this.onBeforeAction)
            result.onBeforeAction = this.onBeforeAction;
        result.onBeforeAction = function(pause){
            MalibunController.current = self.controller;
            MalibunAction.current = self;
            MalibunAction.data = {};
            this.next();
        };
        return result;
    }

    init(){
        Router.route(this.route,this.serialize());
    }
};
MalibunController.current = this;
MalibunController.MalibunAction.baseTitle = 'КИК | ';
MalibunController.MalibunAction.current = null;
var MalibunAction = MalibunController.MalibunAction;
export {MalibunAction};

