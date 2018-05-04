//@component
class MalibunHookClass extends EventEmitter{
    constructor(){
        super();
        this.setMaxListeners(0);
    }

    emit(){
        var args = arguments;
        var self = this;
        var emit = super.emit;
        npmFibers(function(){
            emit.apply(self,args);
        }).run();
    }
};

MalibunHook = new MalibunHookClass();