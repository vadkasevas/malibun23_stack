EmptyCollection = new Mongo.Collection('emptyCollection');
Meteor.emptyCursor = EmptyCollection.find();

var collections = {};

/**
 * Класс mongo коллекции  {@link https://docs.meteor.com/api/collections.html|Meteor Mongo.Collection}
 * @category models
 * @class
 * @extends Mongo.Collection
 * @see {@link https://docs.meteor.com/api/collections.html|Meteor Mongo.Collection}
 **/
MalibunCollection = class MalibunCollection extends Mongo.Collection{
    constructor(name,options){
        options = options || {};
        if(options.modelClass){
            options.transform = function (doc) {
                return new options.modelClass(doc);
            }
        }
        if(options.MONGO_URL){
            options._driver = Mongo.Collection.getDriverByUrl(options.MONGO_URL,options.OPLOG_URL||'');
        }
        super(name,options);//(!!!!)
        if(options.modelClass) {
            options.modelClass.collection = this;
        }
        this._options = options;
        var collection = this;
        Meteor.beforeStartup(function(){
            if(Meteor.isServer){
                Meteor.publish(
                    collection._name,
                    options.publish || function (condition) {
                        return collection.publishCursor(this.userId,condition);
                    }
                );
            }
        });

        if(Meteor.isServer&&options.permissions) {
            this.permissions = new CollectionPermissions(this,options.permissions);
        }

        if(name)
            collections[name] = this;
        this._schema=null;
        this._vueSchema = null;

    }

    /**
     * Получить коллекцию по имени mongo
     * */
    static byName(name){
        return collections[name];
    }

    _defineBatchInsert(){
        try{
            return super._defineBatchInsert();
        }catch(e){
            console.log(this._name,' _defineBatchInsert err:',e);
        }
    }

    /**
     * Подписываемся на изменения по указанному условию
     * @param {object} condition Mongo селектор
     * */
    subscribe(condition){
        return Meteor.subscribe(this._name,condition || {});
    }

    byPk(id){
        return this.findOne({_id:id});
    }

    /**
     * Добавляем документ в коллекцию и возвращаем найденный документ из коллекции
     * @param {object} doc Документ
     * */
    insertAndGet(doc){
        var _id = this.insert(doc);
        return this.findOne({_id:_id});
    }

    /**
     * Возвращаем курсор mongo с учетом прав пользователя
     * @param {string} userId ID пользователя
     * @param {object} condition Mongo селектор
     * @param {object} options Опции
     * */
    publishCursor(userId,condition,options){
        var logData = {
            condition1:condition,
            options:options
        };
        var doLog = ()=>{
            if(this._name!='malibunLogs'&&this._name!='malibunLogsGlobal')
                MalibunLogger.trace(MalibunLogger.TAG_SYSTEM,`publishCursor ${this._name}`,logData,userId);
        };
        condition = condition || {};
        options = options||{};
        if(!this.permissions) {
            doLog();
            return this.find(condition, options);
        }

        var permOptions = this.permissions.findCondition(userId);
        logData.permOptions = permOptions;
        if(!userId) {
            if(!safeGet(permOptions,'default.condition'))
                return Meteor.emptyCursor;
            else{
                condition = _.extend(condition,permOptions.default.condition);
                options = _.extend(options,permOptions.default.options);
                logData.condition2 = condition;
                logData.options2 = options;
                doLog();
                return this.find(condition, options);
            }
        }
        if(Meteor.userIdIsAdmin(userId) ){
            if(!safeGet(permOptions,`group.${Roles.ROLE_ADMIN}.condition`)) {
                logData.emptyCursor=true;
                doLog();
                return Meteor.emptyCursor;
            }else{
                var perms = permOptions.group[Roles.ROLE_ADMIN];
                condition = _.extend(condition,perms.condition);
                options = _.extend(options,perms.options);
                logData.condition3 = condition;
                logData.options3 = options;
                doLog();
                return this.find(condition, options);
            }
        }else{
            var perms = safeGet(permOptions,'owner.condition',false) ?  permOptions.owner :  safeGet(permOptions,`group.${Roles.ROLE_COMPANY}`);
            if(!perms) {
                logData.emptyCursor=true;
                doLog();
                return Meteor.emptyCursor;
            }else{
                condition = _.extend(condition,perms.condition);
                options = _.extend(options,perms.options);
                logData.condition4 = condition;
                logData.options4 = options;
                doLog();
                return this.find(condition, options);
            }
        }

        logData.emptyCursor=true;
        doLog();
        return Meteor.emptyCursor;
    }

    /**
     * Возвращаем курсор mongo пагинации для обычного пользователя
     * @param {Meteor.Pagination} pagination Объект пагинации
     * @param {number} skip Кол-во пропущенных записей с начала
     * @param {Subscription} sub Опции подписки
     * */
    userAuth(pagination,skip,sub){
        var condition = safeGet( pagination.userSettings,`${sub.connection.id}.filters` , {} );
        var userIdField = safeGet(this.permissions,'permissions.userIdField');
        if(userIdField){
            condition[userIdField] = Meteor.currentUserId(sub.userId);
        }
        var sort = safeGet( pagination.userSettings , `${sub.connection.id}.sort`, pagination.sort );
        var options = {skip:skip,sort:sort};
        if(pagination.perPage)
            options.limit = Number( pagination.perPage );
        //console.log('sub.userId:',sub.userId);
        return this.publishCursor( sub.userId ? Meteor.currentUserId(sub.userId) : null ,condition,options);
    }

    /**
     * Возвращаем курсор mongo пагинации для администратора
     * @param {Meteor.Pagination} pagination Объект пагинации
     * @param {number} skip Кол-во пропущенных записей с начала
     * @param {Subscription} sub Опции подписки
     * */
    adminAuth(pagination,skip,sub){
        if(!Meteor.userIdIsAdmin(sub.userId))
            return Meteor.emptyCursor;
        var condition = safeGet( pagination.userSettings,`${sub.connection.id}.filters` , {} );
        var sort = safeGet( pagination.userSettings , `${sub.connection.id}.sort`, pagination.sort );
        var options = {skip:skip,sort:sort};
        if(pagination.perPage)
            options.limit = Number( pagination.perPage );
       // console.log('sub.userId:',sub.userId);
        return this.publishCursor( sub.userId,condition,options);
    }

    auth(userId, condition,options){
        return this.publishCursor(userId,condition,options);
    }

    /**
     * Отображаемые имена переданных полей
     * */
    labels(fields){
        var self = this;
        return fields.map(function(field){
            return self.schema.label(field);
        });
    }

    /**
     * SimpleSchema
     * */
    get schema(){
        return this._schema;
    }
    set schema(schema){
        this._schema = schema;
        if(schema)
            this.attachSchema(schema,{replace:true});
        this.ready = true;
        MalibunCollection.emitter.emit(`${this._name}.ready`);
    }

    get vueSchema(){
        return this._vueSchema;
    }

    set vueSchema(vueSchema){
        this._vueSchema=vueSchema;
    }


};
MalibunCollection.collections = collections;
MalibunCollection.emitter = new EventEmitter();
MalibunCollection.emitter.setMaxListeners(0);
MalibunCollection.ready = function(names,cb){
    names = _.isString(names) ? [names] : names;
    //console.log('names1:',names);
    names = _.filter(names,function(name){
        return !(collections[name]&&collections[name].ready);
    });
    //console.log('names2:',names);
    if(names.length==0)
        return cb();
    var queue = names.length;
    _.each(names,(name)=>{
        MalibunCollection.emitter.once(`${name}.ready`,function(){
            queue--;
            if(queue==0)
                return cb();
        });
    });
};

/**
 * @property {string} _id - ID в коллекции
 */
MalibunModel = class MalibunModel{
    constructor(doc){
        _.extend(this, doc);
    }
/**@returns {MalibunCollection}*/
    get collection(){
        return this.constructor.collection;
    }
    /**
     * Выполняет изменение объекта и сохранение в БД
     * @param {string|Array|object} update
     * */
    update(update){
        var newValues=update;
        var model = this;
        if(Array.isArray(update)){
            newValues = {};
            _.each(update,function(field){
                newValues[field] = model[field];
            });
        }else if(isset(update.$set)){
            newValues = update.$set
        }else if(_.isString(update))
            newValues = {[update]:model[update]};

        _.each(newValues,function(val,key){
            model[key] = val;
        });
        if(!this._id)
            return 0;
        return this.collection.update({_id: this._id}, {$set: newValues}, {multi: false, validate: false});
    }

    /**Удаляем документ*/
    remove(){
        return this.collection.remove({_id:this._id});
    }
};

