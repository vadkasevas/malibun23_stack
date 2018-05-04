@component
class WrappedEventEmitter extends EventEmitter{
    emit(){
        var args = arguments;
        var self = this;
        var emit = super.emit;
        npmFibers(function(){
            emit.apply(self,args);
        }).run();
    }
};