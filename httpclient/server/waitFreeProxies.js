HttpClient.waitFreeProxies = Meteor.wrapAsync(function(callback){
    if(isset(HttpClient.freeProxies))
        return callback();
    HttpClient.listener.once('freeProxies',function(){callback()});
});


HttpClient.rndFreeProxy = function(){};

var loadFreeProxies = function(cb){
    var proxies = [];
    meteorAsync.waterfall(
        (function(){
            var data = [
                {url:'https://github.com/opsxcq/proxy-list/blob/master/list.txt'},
                {url:'https://hidemy.name/ru/proxy-list/?ports=1080&type=hs',port:1080},
                {url:'https://hidemy.name/ru/proxy-list/?ports=80&type=hs',port:80},
                {url:'https://hidemy.name/ru/proxy-list/?ports=8080&type=hs',port:8080},
                {url:'https://hidemy.name/ru/proxy-list/?ports=3128&type=hs',port:3128},
            ];
            return data;
        }).call().map(function(urlData){
            return function(cb){
                HttpClient.forOptions({
                    url:urlData.url,
                    headers:[
                        'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Accept-encoding:gzip, deflate, br',
                        'Accept-language:ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
                        'Cache-control:no-cache',
                        'User-agent:Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
                    ],gzip:true
                }).execute().then(function(err,content,client){
                    //console.log(client.getUrl());
                    var html = safeGet(content,'content','');
                    if(!urlData.port) {
                        var proxiesRe = /(\d+\.\d+\.\d+\.\d+):(\d+)/gi;
                        while (true) {
                            var match = proxiesRe.exec(html);
                            if (match) {
                                proxies.push({
                                    ip: match[1],
                                    port: Number(match[2]),
                                    protocol: 'http'
                                });
                            } else
                                break;
                        }
                    }else{
                        var proxiesRe = /(\d+\.\d+\.\d+\.\d+)/gi;
                        while (true) {
                            var match = proxiesRe.exec(html);
                            if (match) {
                                proxies.push({
                                    ip: match[1],
                                    port: urlData.port,
                                    protocol: 'http'
                                });
                            } else
                                break;
                        }
                    }
                    cb(null,proxies);
                });
            }
        }),
    ).finally(function(err,result){
        var assocProxies = {};
        _.each(result,(proxyData)=>{
            assocProxies[`${proxyData.ip}:${proxyData.port}`] = proxyData;
        });
        var proxies = [];
        _.each(assocProxies,(proxy)=>{
            proxies.push(proxy);
        });

        if(!HttpClient.freeProxies||proxies.length>0)
            HttpClient.freeProxies = proxies;

        console.log('Кол-во прокси:',proxies.length);
        if(cb)
            cb();
    });

};

Meteor.startup(function(){
    loadFreeProxies(function(){
        HttpClient.rndFreeProxy = function(){
            return _.sample(HttpClient.freeProxies);
        };
        HttpClient.listener.emit('freeProxies');
    });
});

Meteor.setInterval(function(){
    loadFreeProxies();
},30*60*1000);


var proxyJudlesData = {};
HttpClient.addProxyJudle = function(id,judle){
    proxyJudlesData[id] = {judle:judle,proxies:{}};

    HttpClient.waitFreeProxies(function(){
        Meteor.setInterval(function(){
            var proxy = HttpClient.rndFreeProxy();
            if(proxy){
                judle(proxy,function(ok){
                    var proxyString = proxy.ip+':'+proxy.port;
                    if(ok&&!isset(proxyJudlesData[id].proxies[proxyString]))
                        proxyJudlesData[id].proxies[proxyString] = proxy;
                    else if(!ok&&isset(proxyJudlesData[id].proxies[proxyString]))
                        delete proxyJudlesData[id].proxies[proxyString];
                });
            }
        },1000);
    });
};

HttpClient.rndJudleProxy = Meteor.wrapAsync(function(judleId,callback){
    if(!isEmpty(proxyJudlesData[judleId].proxies)){
        var key = _.sample(_.keys(proxyJudlesData[judleId].proxies));
        return callback( proxyJudlesData[judleId].proxies[key] );
    }else{
        var interval = Meteor.setInterval(function(){
            if(!isEmpty(proxyJudlesData[judleId].proxies)){
                Meteor.clearInterval(interval);
                var key = _.sample(_.keys(proxyJudlesData[judleId].proxies));
                callback( proxyJudlesData[judleId].proxies[key] );
            }
        },300);
    }
});
