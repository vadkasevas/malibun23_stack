MultipartFile = class MultipartFile {
    constructor(buffer,filename,name,contentType){
        this.buffer = buffer;
        this.name = name;
        this.contentType = contentType;
        this.filename = filename;
    }

    value(){
        return this.buffer;
    }

    static fromFile(path,name){
        var f = Meteor.wrapAsync((cb)=>{
             npmFs.readFile(path,(err,buf)=>{
                 npmFibers(function(){
                     cb(err,buf);
                 }).run();
             });
        });

        try{
            var buffer = f();
            return new MultipartFile(buffer,npmPath.basename(path),name,MIME.lookup(path));
        }catch(e){
            return null;
        }
    }

    save(path){
        var buffer = this.buffer;
        path = path || `/tmp/${generateRandomHash()}.png`;
        var f = Meteor.wrapAsync(function(callback){
            npmFs.writeFile(path, buffer, {encoding:null}, function(err){
                npmFibers(function(){
                    return callback(null,path);
                }).run();
            });
        });
        return f();
    }
};
