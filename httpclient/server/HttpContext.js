var inherits = Npm.require('util').inherits;

HttpContext = function(options){
    this.cookies = {};
    this.clearDomain = options && isset(options.clearDomain) ? options.clearDomain : true;

    EventEmitter.call(this);
    this.setMaxListeners(200);
};

inherits(HttpContext, EventEmitter);

HttpContext.prototype.onClient = function(client,options){
    options = options || {};
    client.useCookies = true;

    var context = this;

    client.on('beforeExecute',function(){
        client.withCookies(context.cookies);
        context.emit('beforeExecute',client,options);
    });

    client.on('setCookie',function(newCookies){
        _.each(newCookies, function (cookie) {
            if(cookie) {
                if (context.clearDomain)
                    cookie.domain = null;
                context.cookies[cookie.key] = cookie;
            }
        });
    });

    context.emit('client',client,options);
};

HttpContext.prototype.cookieByName = function(key,defaultValue){
    if(this.cookies[key])
        return this.cookies[key].value;
    else
        return defaultValue;
};

HttpContext.prototype.getCookieValue = function(key,defaultValue){
    return this.cookieByName(key,defaultValue);
};

HttpContext.prototype.withCookie = function(newCookie){
    newCookie = __.cloneDeep(newCookie);
    if(this.clearDomain)
        newCookie.domain = null;
    var result = false;
    var cookie = this.cookieByName(newCookie.key);
    if(!cookie){
        result = true;
        cookie = {key:newCookie.key};
        this.cookies[cookie.key] = cookie;
    }
    if(!cookie.value||cookie.value!=newCookie.value){
        cookie.value = newCookie.value;
        result = true;
    }
    if(cookie.domain!=newCookie.domain){
        cookie.domain = newCookie.domain;
        result = true;
    }
    if(!cookie.path||cookie.path!=newCookie.path){
        cookie.path = newCookie.path;
        result = true;
    }
    if( (!cookie.expires&&newCookie.expires) ||+cookie.expires!=newCookie.expires){
        cookie.expires = newCookie.expires;
        result = true;
    }
    return result;
};

HttpContext.prototype.withCookies = function(cookies){
    var context = this;
    var result = false;
    _.each(cookies,function(cookie){
        if( context.withCookie(cookie) )
            result = true;
    });
    return result;
};




