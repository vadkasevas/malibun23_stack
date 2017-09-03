var dns = Npm.require('dns');
var net = Npm.require('net');
var nativeDns = Npm.require('native-dns');
/*
var originalDns = dns.lookup;

dns.lookup = function(){
    var index = 1;
    if(arguments[2])
        index = 2;
    var cb = arguments[index];
    arguments[index] = function(){
        console.log(arguments);
        cb.apply(this,arguments);
    };

    originalDns.apply(this,arguments);
};*/

/**/

var dnsServers4 = ['77.88.8.8','8.8.8.8','8.8.4.4','77.88.8.1'];
var dnsServers6 = ['2001:4860:4860::8888','2a02:6b8::feed:0ff','2001:4860:4860::8844','2a02:6b8:0:1::feed:0ff'];

var makeAsync = function(callback) {
    if (typeof callback !== 'function') {
        return callback;
    }
    return function asyncCallback() {
        if (asyncCallback.immediately) {
            callback.apply(null, arguments);
        } else {
            var args = arguments;
            process.nextTick(function() {
                callback.apply(null, args);
            });
        }
    };
};
/*
dns.lookup = function(domain, family, callback) {
    //debugger;
    if (arguments.length === 2) {
        callback = family;
        family = 4;
    } else if (!family) {
        family = 4;
    } else {
        if(typeof family!='number')
            family = family.family || 4;
        family = +family;
        if (family !== 4 && family !== 6) {
            throw new Error('invalid argument: `family` must be 4 or 6');
        }
    }

    callback = makeAsync(callback);
    if (!domain) {
        callback(null, null, family === 6 ? 6 : 4);
        return {};
    }
    if (process.platform == 'win32' && domain == 'localhost') {
        callback(null, '127.0.0.1', 4);
        return {};
    }
    var matchedFamily = net.isIP(domain);
    if (matchedFamily) {
        callback(null, domain, matchedFamily);
        return {};
    }

    var onanswer = function(addresses) {
       // console.log(domain,addresses);
        if (addresses) {
            if (family) {
                callback(null, addresses[0], family);
            } else {
                callback(null, addresses[0], addresses[0].indexOf(':') >= 0 ? 6 : 4);
            }
        } else {
            callback(new Error('ENOTFOUND','ENOTFOUND'));
        }
    };

    var servers = family==6 ? dnsServers6 : dnsServers4;

    meteorAsync.seqNew(
        servers.map(function(server){
            return function(handler,cb){
                if(handler.addrs)
                    return cb();
                var wrapper = _.once(function(addrs){
                    if(addrs)
                        handler.addrs = addrs;
                    cb();
                });
                var question = nativeDns.Question({
                    name: domain,
                    type:family === 6 ? 'AAAA' : 'A'
                });
                var req = nativeDns.Request({
                    question: question,
                    server: {address:server,type: 'udp'},
                    timeout: 20000
                });

                req.on('timeout', function () {  wrapper() });

                req.on('message', function (err, answer) {
                    if(err||!answer)
                        return wrapper();
                    var addr = null;
                    answer.answer.forEach(function (a) {
                        if(a.address)
                            addr = a.address;
                    });
                    wrapper([addr]);
                });

                req.on('end', function () {  wrapper() });

                req.on('error', function () { wrapper(); });

                req.send();
            }
        })
    ).finally((err,handler)=>{
        onanswer(handler.addrs);
    });



    return {};
};
*/