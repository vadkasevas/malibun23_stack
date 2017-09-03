var iconv = Npm.require('iconv-lite');
var fs = Npm.require('fs');
var fileExists = function(fileName) {
    try {
        var stats = fs.lstatSync(fileName);
        return  (stats.isFile());
    }
    catch (e) {
        return false;
    }
};

var unknownEncodings = [];
var _file = MalibunStorage.ensureDir('.tmp')+'/unknownEncodings.txt';
if(fileExists(_file)){
    var _data = fs.readFileSync(_file,{encoding:'utf8'});
    _.each( _data.split("\n"),function(line){
        var encoding = line.trim().toLowerCase();
        if(encoding)
            unknownEncodings.push(line.trim().toLowerCase());
    });
}

var decodeBuffer = function (buffer, contentTypeHeader) {
    var embeddedEncoding = /<meta.*charset=["']{0,1}([^"'>]*)["']{0,1}\s*\/{0,1}>/i.exec(buffer.toString(undefined, 0, 512)) || [],
        encoding = embeddedEncoding[1] || contentTypeHeader.split("charset=")[1] || contentTypeHeader;
    encoding = iconv.encodingExists(encoding) ? encoding : "utf-8";
    return iconv.decode(buffer, encoding);
};

function extractCharsetFromContentType(httpContentType) {
    if(httpContentType && typeof httpContentType === 'string') {
        var re = /charset=([^\s]+)/i;
        var match = re.exec();
        if(match)
            return match[1];
    }
}

AutoencodingHttpClient = class AutoencodingHttpClient extends HttpClient{
    execute(options){
        if(safeGet(options,'redirect'))
            return super.execute();

        this.encoding = null;
        this.withNpmRequestOptions({encoding : null});
        var client = this;
        return new MalibunPromise((resolve,reject)=>{
            super.execute().then(function autoencodingparse(err,response){
                if(response&&response.content){
                    //debugger;
                    response.content = decodeBuffer(response.content,safeGet(response,'headers.content-type',''));
                    /*var httpEncoding = extractCharsetFromContentType(response.headers['content-type']);
                    var utfEncoded = response.content.toString();
                    var match = /<\s*meta[^>]*charset=['"]?([^\s"']+)/i.exec(utfEncoded);
                    var htmlEncoding = match ?  match[1] : null;

                    var encoding = htmlEncoding || httpEncoding || 'utf8';
                    encoding = encoding.toLowerCase()=='utf-8' ? 'utf8' : encoding.toLowerCase();
                    console.log('url:',client.baseUrl);
                    console.log('encoding:',encoding);
                    if(iconv.encodingExists(encoding)){
                        response.content = (encoding!='utf8') ? iconv.decode(response.content, encoding+'//IGNORE') : utfEncoded;
                    }else{
                        response.content = '';
                        if(encoding&&unknownEncodings.indexOf(encoding)==-1){
                            unknownEncodings.push(encoding);
                            fs.appendFileSync(process.env.PWD+'/tmp/unknownEncodings.txt',encoding+"\n");
                        }
                    }
                    */
                }

                if(err)
                    return reject(err,response);
                else
                    return resolve(response);
            });
        });
    }

    static forOptions(options){
        options.clientClass = AutoencodingHttpClient;
        return HttpClient.forOptions(options);
    }
};