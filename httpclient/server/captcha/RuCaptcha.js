var rucaptchaDir = MalibunStorage.ensureDir('.data/rucaptcha');
if(!dirExists(rucaptchaDir))
    mkdir(rucaptchaDir);
var imagesSaver = new PowerQueue({maxProcessing:1});
var nextId = 1;
var files = npmFs.readdirSync(rucaptchaDir);
_.each(files,(file)=>{
    var currentId = Number(safeGet(/(\d+)\.png$/gi.exec(file),1,0));
    if(currentId&&currentId>=nextId)
        nextId = currentId+1;
});

imagesSaver.addFile = function(buffer){
    return new MalibunPromise((resolve,reject)=>{
        imagesSaver.add(function(done){
            var path = `${rucaptchaDir}/${nextId++}.png`;
            npmFs.writeFile(path, buffer, {encoding:null}, function(err){
                npmFibers(function(){
                    done();
                    if(err)
                        return reject(err);
                    else
                        return resolve(path);
                }).run();
            });
        });
    });
};

RuCaptcha = class RuCaptcha extends Antigate{
    constructor(key){
        super(key);
        this.domain = 'rucaptcha.com';
    };

    rotateFromMultipartFile(file,requestOptions){
        requestOptions = requestOptions || {};
        requestOptions.method = 'rotatecaptcha';
        var antigate = this;
        return new MalibunPromise((resolve,reject)=>{
            FuncaptchaGroups.findByImage(file.value()).finally((err,group,cachedAngle)=>{
                //console.log('findByImage group:',group,'cachedAngle:',cachedAngle);
                if(cachedAngle)
                    return resolve(cachedAngle,group);
                return antigate.process(file,requestOptions).finally((err,captchaText, captchaId)=>{
                    var angle = Number(captchaText);
                    if(err||!angle)
                        return reject(err||new Error('Получили нулевой поворот'));
                    if(angle){
                        imagesSaver.addFile(file.value()).finally((err,savedPath)=>{
                            FuncaptchaGroups.insert({
                                file:savedPath,
                                angles:[angle]
                            });
                        });
                    }
                    resolve(angle, null);
                });
            });            
        });
    };

    rotateFromUrl(url,beforeExec,requestOptions){
        var antigate = this;
        return new MalibunPromise((resolve,reject,promise)=>{
            antigate.loadCaptcha(url,beforeExec).finally((err,file)=>{
                if(err)
                    return reject(err);
                if(!file)
                    return reject(new Error(`Ошибка при загрузке файла ${url}`));

                return antigate.rotateFromMultipartFile(file,requestOptions).finally(promise);
            });
        });
        
    };

    rotateFromFile(filename,requestOptions) {
        requestOptions = requestOptions || {};
        requestOptions.method = 'rotatecaptcha';
        var antigate = this;
        return new MalibunPromise((resolve,reject,promise)=>{
            var file = MultipartFile.fromFile(filename,'file_1');
            if(!file)
                return reject(new Error(`Ошибка при чтении файла ${filename}`));
            return antigate.rotateFromMultipartFile(file,requestOptions).finally(promise);
        });
    };

    static getInstance(){
        return new RuCaptcha('c42f2eae412bb0c67847a1e75dacc86f');
    };

};