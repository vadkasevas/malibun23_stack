var fs = Npm.require('fs');
var mkdirp = Npm.require('mkdirp');
var npmFibers = Npm.require('fibers');
fileExists = Meteor.wrapAsync( function(fileName,callback) {
    npmFs.lstat(fileName, function (err, stat) {
        npmFibers(function () {
            if (err)
               return callback(null,false);
            return callback(null,stat.isFile())
        }).run();
    });
});

dirExists = Meteor.wrapAsync( function(dirName,callback) {
    npmFs.lstat(dirName, function (err, stat) {
        npmFibers(function () {
            if (err)
                return callback(null,false);
            return callback(null,stat.isDirectory())
        }).run();
    });
});

mkdir = function(dirName){
    return mkdirp.sync(dirName);
};

readFileSync = Meteor.wrapAsync(function(file,options,callback){
    var _args = [file];
    if(callback)
        _args.push(options);
    _args.push(function(err,data){
        npmFibers(function(){
            callback(err,data);
        }).run();
    });
    fs.readFile.apply(null,_args)
});
