RecaptchaSolver = function(client){
    this.client = client;
};

RecaptchaSolver.prototype.execute = function(callback){
    var client = this.client;
    client.execute().then(function(err,content){
        var baseUrl = client.getUrl();
        var match = /google\.com\/recaptcha\/api\/challenge\?k=([^"]+)/gi.exec(safeGet(content,'content',''));
        if(!match)
            return callback( err || new Error('Код:'+safeGet(content,'statusCode','?')) );

        var k = match[1];
        var form = HtmlForm.findOne(baseUrl,content.content);
        if(!form)
            return callback(new Error(content.content));

        HttpClient.forOptions({
            url:"https://www.google.com/recaptcha/api/challenge?k=" + k,
            headers:['Referer:'+baseUrl ,'User-Agent:'+client.hasHeader('User-Agent') ],
            proxy:client.proxy
        }).execute().then(function(err,content){

            var challenge = safeGet(
                /challenge\s*:\s*'([^']+)/.exec(
                    safeGet(content,'content','')
                )
                ,1,false
            );
            if(!challenge)
                return callback(err||new Error('Код:'+safeGet(content,'statusCose','?')));
            HttpClient.forOptions({
                url:"https://www.google.com/recaptcha/api/reload?c=" + challenge + "&k=" + k + "&lang=ru&reason=i&type=image",
                proxy:client.proxy,
                headers:['Referer:'+baseUrl,'User-Agent:'+client.hasHeader('User-Agent')]
            }).execute().then(function(err,content){
                var challenge = safeGet(
                    /Recaptcha\.finish_reload\('([^']+)/.exec(
                        safeGet(content,'content','')
                    )
                    ,1,false
                );
                if(!challenge)
                    return callback( err || new Error('Код:'+safeGet(content,'statusCode','?')) );

                var antigate = Antigate.getInstance();
                var beforeExec = function (imgClient) {
                    imgClient.withHeader('Referer', baseUrl  );
                    imgClient.withHeader("Accept", "image/png,image/*;q=0.8,*/*;q=0.5");
                    imgClient.withHeader("Accept-Language", "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3");
                    imgClient.withHeader('User-Agent', client.hasHeader('User-Agent'));
                    imgClient.withProxy(client.proxy);
                };
                return antigate.processFromURL('https://www.google.com/recaptcha/api/image?c=' + challenge, beforeExec, function (error, text, id) {
                    if(error)
                        return callback(error,false);
                    if (!text)
                        return callback(new Error('Ошибка при распознавании капчи: текст капчи пуст. Нездоровая хуйня'),false);

                    form.inputs.recaptcha_challenge_field = challenge;
                    form.inputs.recaptcha_response_field = text;
                    return callback(null,form);
                });

            });

        });

    });
};

