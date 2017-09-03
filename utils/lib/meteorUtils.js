throttle = function(fn, timeout, ctx) {
    var timer, args, needInvoke;
    return function() {
        args = arguments;
        needInvoke = true;
        ctx = ctx || this;

        if(!timer) {
            (function() {
                if(needInvoke) {
                    needInvoke = false;
                    fn.apply(ctx, args);
                    timer = Meteor.setTimeout(arguments.callee, timeout);
                }
                else {
                    timer = null;
                }
            })();
        }

    };

};