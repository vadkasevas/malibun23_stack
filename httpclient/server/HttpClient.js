var inherits = Npm.require('util').inherits;
var HttpsAgentKeepAlive = Npm.require('agentkeepalive').HttpsAgent;

HttpClient = function(url){
    this.baseUrl = url;
    this._url = '';
    this.getParams = {};
    this.timeout = HttpClient.DEFALT_TIMEOUT;
    this.headers = {};
    this.cookies = {};
    this.proxy = null;
    this.httpMethod = null;
    this.postData = {};
    this.files = [];
    this.useCookies = false;
    this.npmRequestOptions = {};
    this.formContentType = HttpClient.FORM_MULTIPART;
    this.followLocation = false;
    this.redirectsCount = 0;
    this.gzip = false;
    this.encoding = 'utf8';
    this.keepAlive = false;
    EventEmitter.call(this);

    this.on('error',(err,content)=>{
        HttpClient.listener.emit('error',err,content,this);
    });
    this.on('success',(content)=>{
        HttpClient.listener.emit('success',content,this);
    });
    this.setMaxListeners(50);
};
inherits(HttpClient, EventEmitter);

HttpClient.forOptions = function(options){
    var clientClass = options.clientClass || HttpClient;
    var client = new clientClass(options.url);
    if(options.headers) {
        client.withHeaders(options.headers);
    }
    if(options.cookies){
        client.useCookies = true;
        client.withCookies(options.cookies);
    }
    if(options.proxy)
        client.withProxy(options.proxy);
    if(options.httpMethod)
        client.withHttpMethod(options.httpMethod);
    if(options.postData){
        client.withPostData(options.postData);
    }
    if(options.files)
        client.files = options.files;
    if(options.formContentType)
        client.formContentType = options.formContentType;
    if(options.followLocation)
        client.followLocation = options.followLocation;
    if(isset(options.timeout))
        client.timeout = options.timeout;
    if(isset(options.gzip))
        client.gzip = options.gzip;
    if(options.keepAlive)
        client.keepAlive = true;
    if(options.encoding)
        client.encoding = options.encoding;
    if(options.referer){
        if(typeof(options.referer)=='string')
            client.withHeader('Referer',options.referer,false);
        else if(isset(options.referer.execute))
            client.withHeader('Referer',options.referer.getUrl(),false);
    }
    if(options.context)
        options.context.onClient(client,options.contextOptions || {});

    if(options.getParams){
        _.each(options.getParams,function(value,key){
            client.withGetParam(key,value);
        });
    }

    return client;
};

HttpClient.prototype.filteredExecute = function(filter){
    var url = this.getUrl();
    var client = this;
    return new MalibunPromise(function (resolve,reject) {
        client.on('error',function(err){
            //console.log('err:',err);
            Meteor.setTimeout(function(){
                client.baseUrl = url;
                client.execute();
            },0);
        });
        client.on('success',function(content){
            if(filter(content,client)){
                return resolve(content);
            }else{
                Meteor.setTimeout(function(){
                    client.emit('error');
                },0);
            }
        });
        client.execute();
    });
};

HttpClient.prototype.execute = function(){
    //debugger;
    var _client = this;
    this._url = '';
    var url = this.getUrl();
    //console.log('url:',url);
    HttpClient.listener.emit('beforeExecute',this,url);
    this.emit('beforeExecute');
    
    HttpClient.totalCount++; HttpClient.handlersCount++;

    var httpOptions = {timeout:this.timeout,followRedirects:false,
        encoding:this.encoding,npmRequestOptions:{strictSSL : false,rejectUnauthorized: false}};
    if(this.proxy&&this.proxy.ip){
        var protocol = this.proxy.protocol;
        //if(protocol&&protocol.toLowerCase()=='https')
        //    protocol = 'http';
        var proxyUrl = protocol+'://';
        if(this.proxy.login){
            proxyUrl+=this.proxy.login+':'+this.proxy.pass+'@';
        }
        proxyUrl+=this.proxy.ip+':'+this.proxy.port;
        //console.log('proxyUrl:',proxyUrl);
        httpOptions.npmRequestOptions.agent = new HttpClient.ProxyAgent(proxyUrl);
        if(protocol=='http'||protocol=='https')
            httpOptions.npmRequestOptions.tunnel = false;
    }else{
        httpOptions.npmRequestOptions.pool = HttpClient.npmRequestPool;
        // httpOptions.npmRequestOptions.agent = new http.Agent({keepAlive:true/*,keepAliveMsecs:1000*/});
        if(this.keepAlive) {
            httpOptions.npmRequestOptions.agent = new HttpsAgentKeepAlive({
                maxSockets: 10,
                maxFreeSockets: 10,
                timeout: this.timeout,
                keepAliveTimeout: this.timeout
            });
        }
    }
    if(this.gzip){
        httpOptions.npmRequestOptions.gzip = this.gzip;
    }

    if(this.useCookies) {
        var jar = HttpClient.npmRequest.jar();
        if (this.cookies) {
            for(var cookieKey in this.cookies){
                try {
                    var cookie = this.cookies[cookieKey];
                    if(!isset(cookie.TTL)){
                        cookie = new HttpClient.Cookie(cookie);
                    }
                    jar.setCookie( cookie.toString() , url);
                } catch (e) {
                    //console.log(e.stack );
                }
            }
        }
        httpOptions.npmRequestOptions.jar = jar;
    }

    var formData = null;
    if(_.size(this.files)>0){
        if(this.httpMethod!=HttpClient.METHOD_PUT)
            this.withHttpMethod( HttpClient.METHOD_POST );
        if(this.postData&&_.size(this.postData)>0){
            formData = {};
            for(var postKey in this.postData){
                formData[postKey] = this.postData[postKey];
            }
            this.postData = null;
        }

        if(this.formContentType==HttpClient.FORM_MULTIPART) {
            formData = formData || {};
            _.each(this.files, function (file) {
                formData[file.name] = {
                    value: file.value(),
                    options: {
                        filename: file.filename,
                        contentType: file.contentType,
                    }
                }
            });
        }else{
            var file = this.files[0];
            httpOptions.npmRequestOptions.body = file.value();
            this.withHeader('Content-Type',file.contentType,true);
        }
    }

    if(this.httpMethod==HttpClient.METHOD_POST) {
        if(this.formContentType==HttpClient.FORM_URLENCODED_UTF8){
            this.withHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8',true);
        }
        if(this.formContentType==HttpClient.FORM_URLENCODED){
            this.withHeader('Content-Type','application/x-www-form-urlencoded',true);
        }
        if(this.formContentType!=HttpClient.POST_SINGLEFILE) {
            if (formData) {
                httpOptions.npmRequestOptions.formData = formData;
            } else if (this.postData) {
                if (this.formContentType == HttpClient.FORM_MULTIPART)
                    httpOptions.npmRequestOptions.formData = JSON.parse(JSON.stringify(this.postData));
                else
                    httpOptions.npmRequestOptions.form = this.postData;
            }
        }
    }
    for(var key in this.npmRequestOptions)
        httpOptions.npmRequestOptions[key] = this.npmRequestOptions[key];

    httpOptions.headers = this.headers;

    var callbacks = [];

    var result = {
        then:function(cb){
            callbacks.push(cb);
            return result;
        },
        success:function(cb){
            callbacks.push(function(err,content){
                if(!err)
                    cb(content,_client);
            });
            return result;
        },
        error:function(cb){
            callbacks.push(function(err,content){
                if(err)
                    cb(err,content,_client);
            });
            return result;
        }
    };

    if(this.proxy){
        if(_client.proxy.onSuccess) {
            var onSuccess = function () {
                _client.proxy.onSuccess();
            };
            this.on('success', onSuccess);
        }
        if(_client.proxy.onError) {
            this.on('error', function () {
                _client.proxy.onError();
            });
        }
    }

    this.once('response',function(err,content){
        _.each(callbacks,function(callback){
            callback(err,content,_client);
        });
    });
/*
    _client.on('location',function(result){
        console.log( result.headers.location );
    });*/
    try {
        httpCall(
            this.getHttpMethod(),
            url,
            httpOptions,
            function (error, result) {
                //debugger;
                if (_client.useCookies) {
                    _client.doIncomingCookies(result);
                }
                HttpClient.handlersCount--;
                HttpClient.requestedCount++;

                if (!result && !error)
                    error = new Error('Uknown error while HttpClient Request');
                if (!error) {
                    if (_client.followLocation && result && result.headers && [302, 301,303,307].indexOf(result.statusCode) != -1
                        && result.headers.location && _client.redirectsCount < 20) {
                        _client.redirectsCount++;
                        _client.httpMethod = HttpClient.METHOD_GET;
                        _client.postData = {};
                        _client.files = [];
                        _client.baseUrl = HttpClient.resolveUrl(url, result.headers.location);
                        _client.getParams = {};
                        _client.emit('location', result);
                        _client._url = '';

                        return _client.execute({redirect:true});
                    } else
                        _client.emit('success', result);
                } else {
                    _client.emit('error', error, result);
                }
                HttpClient.listener.emit('afterExecute');
                _client.emit('response', error, result);
            }
        );
    }catch(e){
        Meteor.setTimeout(function(){
            _client.emit('error', e, null);
        },100);
    }
    return result;
};

HttpClient.prototype.asyncExec = function(){
    var _client = this;
    var exec = Meteor.wrapAsync(
        function(callback){
            var callBackWrapper = null;
            var onSuccess = function(content){
                callBackWrapper(null,content);
            };
            var onError = function(err,content){
                callBackWrapper(err,content);
            };
            callBackWrapper = function(err,content){
                _client.removeListener('success',onSuccess);
                _client.removeListener('error',onError);
                callback(err,content);
            };
            _client.once('success',onSuccess);
            _client.once('error',onError);
            _client.execute();
        }
    );
    return exec();
};

HttpClient.prototype.withPostData = function(data){
    for(var key in data){
        this.postData[key] = data[key];
    }
    return this;
};

/*
 contentType: 'text/csv',
 name: 'spreadsheet1.csv',
 path:path
 file: path // fake function to generate csv data
 */
HttpClient.prototype.withFile = function(fileData){
    this.files.push(fileData);
    return this;
};

HttpClient.prototype.withProxy = function(proxy){
    this.proxy = proxy;
    return this;
};

HttpClient.prototype.withNpmRequestOptions = function(options){
    for(var key in options){
        this.npmRequestOptions[key] = options[key];
    }
    return this;
};

HttpClient.prototype.withHttpMethod = function(method){
    this.httpMethod = method;
    return this;
};

HttpClient.prototype.withGetParam = function(key,val){
    this.getParams[key] = val;
    return this;
};

HttpClient.prototype.withHeader = function(hKey,hVal,safe){
    if(!safe||!this.hasHeader(hKey))
        this.headers[hKey] = hVal;
    return this;
};

HttpClient.prototype.withHeaders = function(headers,safe){
    if(Array.isArray(headers)){
        var re = /([^:]+):(.+)/;
        _.each(headers,function(s){
            var match =re.exec(s);
            if(match)
                this.withHeader( match[1].trim() , match[2].trim(),safe );
        },this);
    }else{
        for (var hKey in headers)
            this.withHeader(hKey, headers[hKey],safe);
    }
    return this;
};

HttpClient.prototype.hasHeader = function(hKey){
    var result = false;
    for(var key in this.headers){
        if(key.toLowerCase()==hKey.toLowerCase())
            result = this.headers[key];
    }
    return result;
};

HttpClient.prototype.withCookies = function(cookies){
    var _client = this;
    if(Array.isArray(cookies)){
        _.each(cookies,function(cookie){
            _client.withCookie(cookie);
        });
    }else{
        for(var key in cookies)
            this.withCookie(cookies[key]);
    }
    return this;
};

HttpClient.prototype.withCookie = function(cookie){
    var key = cookie.key || cookie.name;
    this.cookies[key] = cookie;
    return this;
};

HttpClient.prototype.getUrl = function(){
    if(!this._url){
        if(_size(this.getParams)>0) {
            var urlData = HttpClient.urlParser.parse(this.baseUrl, true, true);
            urlData.search = '';
            for (var get_param in this.getParams) {
                urlData.query[get_param] = this.getParams[get_param];
            }
            this._url = HttpClient.urlParser.format(urlData);
        }else
            this._url = this.baseUrl;
    }
    return this._url;
};

HttpClient.prototype.getHttpMethod = function(){
    if(this.httpMethod)
        return this.httpMethod;
    if( _.size( this.postData )>0||this.files.length>0)
        return HttpClient.METHOD_POST;
    else
        return HttpClient.METHOD_GET;
};

HttpClient.prototype.doIncomingCookies = function doIncomingCookies(content){
    if (content && content.headers) {
        var headers = content.headers;
        var cookies;
        if (headers['set-cookie']) {
            if (headers['set-cookie'] instanceof Array)
                cookies = headers['set-cookie'].map(function (c) {
                    return (HttpClient.Cookie.parse(c));
                });
            else
                cookies = [HttpClient.Cookie.parse(headers['set-cookie'])];

            this.emit('setCookie',cookies);
        }
    }
};

HttpClient.prototype.withUrl = function(url){
    this.baseUrl = url;
    this._url = '';
    return this;
};

HttpClient.prototype.withHttpContext = function(context){
    context.onClient(this);
    return this;
};

HttpClient.resolveUrl = function(base,to){
    var toData =  HttpClient.urlParser.parse(to);
    if(toData.host||toData.hostname){
        return to;
    }else{
        return HttpClient.urlParser.resolve(base,to);
    }
};

HttpClient.buildUrl = function(baseUrl,params){
    var urlData = HttpClient.urlParser.parse(baseUrl, true, true);
    urlData.search = '';
    if(params)
        _.each(params,(value,key)=>{
            urlData.query[key] = value;
        });
    return HttpClient.urlParser.format(urlData);
};

HttpClient.overwriteGetParams = function(url,value){
    var urlData = HttpClient.urlParser.parse(url, true, true);
    if(!urlData)
        return url;

    delete urlData.search;
    _.each(urlData.query, function (q, k) {
        urlData.query[k] = value;
    });
    return HttpClient.urlParser.format(urlData);
};


HttpClient.METHOD_GET = 'GET';
HttpClient.METHOD_POST = 'POST';
HttpClient.METHOD_PUT = 'PUT';

HttpClient.totalCount = 0;
HttpClient.handlersCount = 0;
HttpClient.requestedCount = 0;
HttpClient.npmRequestPool = {maxSockets: 1000};
HttpClient.urlParser = Npm.require('url');
HttpClient.DEFALT_TIMEOUT = 5*60*1000;
HttpClient.ProxyAgent = Npm.require('proxy-agent');
HttpClient.npmRequest = Npm.require('request');
//HttpClient.npmRequest.debug = true;
HttpClient.Cookie = Npm.require('tough-cookie').Cookie;
HttpClient.FORM_URLENCODED='FORM_URLENCODED';
HttpClient.FORM_MULTIPART = 'FORM_MULTIPART';
HttpClient.FORM_URLENCODED_UTF8='FORM_URLENCODED_UTF8';
HttpClient.POST_SINGLEFILE = 'POST_SINGLEFILE';

HttpClient.listener = new EventEmitter();
HttpClient.listener.setMaxListeners(200);
HttpClient.listener.on('error',()=>{});


