MalibunStorageClass = class MalibunStorageClass{
    get path(){
        if(process.env.STORAGE_PATH){
            return process.env.STORAGE_PATH;
        }
        return process.env.PWD;
    }

    ensureDir(relativeDir){
        var absPath = `${MalibunStorage.path}/${relativeDir}`;
        if(!dirExists(absPath))
            mkdir(absPath);
        return absPath;
    }
};

MalibunStorage = new MalibunStorageClass();