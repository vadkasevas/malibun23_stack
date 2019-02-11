Antigate = class Antigate{
    constructor(key){
        this.key = key;
        this.domain = 'antigate.com';
    }

    process(file,requestOptions) {
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            antigate.upload(file,requestOptions).finally((err,captchaId)=>{
                if(err)
                    return reject(err);
                antigate.check(captchaId).finally(
                    (err,captchaText)=>{
                        if(err) 
                            return reject(err);
                        resolve(captchaText, captchaId);
                    }
                );
            });
        });
    };

    processFromFile(filename,requestOptions) {
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            var file = MultipartFile.fromFile(filename,'file');
            if(!file)
                return reject(new Error(`Ошибка при чтении файла ${filename}`));

            return antigate.process(file,requestOptions).finally((err,captchaText,captchaId)=>{
                if(err)
                    return reject(err);
                resolve(captchaText,captchaId,file);
            });
        });
    };

    processFromURL(url,beforeExec,requestOptions) {
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            antigate.loadCaptcha(url,beforeExec).finally((err,file)=>{
                if(err)
                    return reject(err);
                return antigate.process(file,requestOptions).finally((err,captchaText, captchaId)=>{
                    if(err)
                        return reject(err);
                    resolve(captchaText, captchaId,file);
                })
            });
        });
    };

    upload(file,requestOptions) {
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            var client = HttpClient.forOptions({
                url:`http://${antigate.domain}/in.php`,
                postData:{
                    method: safeGet(requestOptions,'method','post'),
                    key: antigate.key
                },
                formContentType:HttpClient.FORM_MULTIPART,
                httpMethod:HttpClient.METHOD_POST,
            });
            client.withFile(file);
            if(requestOptions){
                client.withPostData(requestOptions);
            }
            client.execute().then((err,content)=>{
                var html = safeGet(content,'content','');
                if (html.indexOf('OK') === 0) {
                    resolve(content.content.split('|')[1]);
                } else {
                    reject(new Error(html));
                }
            });
        });
    };

    check(id) {
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            HttpClient.forOptions({
                url:`http://${antigate.domain}/res.php?key=${antigate.key}&action=get&id=`+ id
            }).execute().then(function(err,content){
                if(err)
                    return reject(err);
                var html = safeGet(content,'content','');
                if (html.indexOf('OK') === 0) {
                    resolve(content.content.split('|')[1]);
                } else if(html=='CAPCHA_NOT_READY'){
                    Meteor.setTimeout(function() {
                        antigate.check(id).finally((err,checkResult)=>{
                            if(err)
                                return reject(err);
                            else
                                return resolve(checkResult);
                        });
                    }, 5000);
                } else{
                    reject(err||new Error(html));
                }
            });
        });

    };

    getBalance() {
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            HttpClient.forOptions({
                url:`http://${antigate.domain}/res.php?key=${antigate.key}&action=getbalance`
            }).execute().then(function(err,content){
                if (err)
                    return reject(err);
                var html = safeGet(content,'content','');
                if(typeof(html)=='string'&&html.length>0)
                    return resolve(parseFloat(html));
                else
                    return reject(new Error(html));
            });
        });
    };

    loadCaptcha(url,beforeExec) {
        return new MalibunPromise((resolve,reject)=>{
            var client = new HttpClient(url);
            if(beforeExec) {
                if (beforeExec instanceof HttpClient) {
                    client = beforeExec;
                    client.baseUrl = url;
                } else if (beforeExec instanceof HttpContext) {
                    beforeExec.onClient(client);
                } else {
                    beforeExec(client);
                }
            }
            client.withNpmRequestOptions({encoding : null});

            client.execute().then(function(err,content){
                if (!err && content.statusCode === 200 && content.content) {
                    var contentType = safeGet(content,'headers.content-type','image/jpeg');
                    var file = new MultipartFile(content.content,'file','file',contentType);
                    return resolve(file,content);
                } else {
                    return reject(err||new Error(content));
                }
            });
        });
    };

    static getInstance(){
        return new Antigate('80fd736e14ddde0a3afc757a0c2b9749');
    };

};

Antigate.prototype.report = function(id, callback) {
    var url = 'http://antigate.com/res.php?key='
        + this.key
        + '&action=reportbad&id='
        + id;

    var client = new HttpClient(url);
    var onResponse = function(error, response){
        if (typeof callback !== 'function') {
            return;
        }
        if (error) {
            callback(error);
        } else {
            if (response&&response.content&&response.content.indexOf('OK') === 0) {
                callback(null);
            } else {
                callback(new Error(response.content));
            }
        }
    };
    client.on('success',function(response){
        onResponse(null,reponse);
    });
    client.on('error',function(err,response){
        onResponse(err,reponse);
    });
    client.execute();
};
