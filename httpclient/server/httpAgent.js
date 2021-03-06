var net = Npm.require('net');
var util = Npm.require('util');
// New Agent code.

// The largest departure from the previous implementation is that
// an Agent instance holds connections for a variable number of host:ports.
// Surprisingly, this is still API compatible as far as third parties are
// concerned. The only code that really notices the difference is the
// request object.

// Another departure is that all code related to HTTP parsing is in
// ClientRequest.onSocket(). The Agent is now *strictly*
// concerned with managing a connection pool.

var Agent = function(options) {
    if (!(this instanceof Agent))
        return new Agent(options);

    EventEmitter.call(this);

    var self = this;
    self.options = options || {};
    self.requests = {};
    self.sockets = {};
    self.freeSockets = {};
    self.keepAliveMsecs = self.options.keepAliveMsecs || 1000;
    self.keepAlive = self.options.keepAlive || false;
    self.maxSockets = self.options.maxSockets || Agent.defaultMaxSockets;

    self.on('free', function(socket, host, port, localAddress) {
        var name = host + ':' + port;
        if (localAddress) {
            name += ':' + localAddress;
        }

        if (!socket.destroyed &&
            self.requests[name] && self.requests[name].length) {
            self.requests[name].shift().onSocket(socket);
            if (self.requests[name].length === 0) {
                // don't leak
                delete self.requests[name];
            }
        } else {
            // If there are no pending requests, then put it in
            // the freeSockets pool, but only if we're allowed to do so.
            var req = socket._httpMessage;
            if (req &&
                req.shouldKeepAlive &&
                !socket.destroyed &&
                self.options.keepAlive) {
                var freeSockets = self.freeSockets[name];
                var count = freeSockets ? freeSockets.length : 0;
                if (self.sockets[name])
                    count += self.sockets[name].length;

                if (count > self.maxSockets) {
                    socket.destroy();
                } else {
                    freeSockets = freeSockets || [];
                    self.freeSockets[name] = freeSockets;
                    socket.setKeepAlive(true, self.keepAliveMsecs);
                    socket.unref();
                    socket._httpMessage = null;
                    freeSockets.push(socket);
                }
            } else {
                socket.destroy();
            }
        }
    });
    self.createConnection = net.createConnection;
}


util.inherits(Agent, EventEmitter);

Agent.defaultMaxSockets = Infinity;

Agent.prototype.defaultPort = 80;
Agent.prototype.addRequest = function(req, host, port, localAddress) {
    var name = host + ':' + port;
    if (localAddress) {
        name += ':' + localAddress;
    }
    if (!this.sockets[name]) {
        this.sockets[name] = [];
    }

    if (this.freeSockets[name] && this.freeSockets[name].length) {
        // we have a free socket, so use that.
        var socket = this.freeSockets[name].shift();

        // don't leak
        if (!this.freeSockets[name].length)
            delete this.freeSockets[name];

        socket.ref();
        req.onSocket(socket);
    } else if (this.sockets[name].length < this.maxSockets) {
        // If we are under maxSockets create a new one.
        var s = this.createSocket(name, host, port, localAddress, req);
        if(s)
            req.onSocket(s);
        else
            req.abort();

    } else {
        // We are over limit so we'll add it to the queue.
        if (!this.requests[name]) {
            this.requests[name] = [];
        }
        this.requests[name].push(req);
    }
};

Agent.prototype.createSocket = function(name, host, port, localAddress, req) {
    var self = this;
    var options = util._extend({}, self.options);
    options.port = port;
    options.host = host;
    options.localAddress = localAddress;

    options.servername = host;
    if (req) {
        var hostHeader = req.getHeader('host');
        if (hostHeader) {
            options.servername = hostHeader.replace(/:.*$/, '');
        }
    }

    var s = null;

    try{
        s = self.createConnection(options);
    }catch(e){
        process.nextTick(function(){
            req.emit('error',e);
        });
        return null;
    }
    if(!s)
        return null;

    if (!self.sockets[name]) {
        self.sockets[name] = [];
    }
    this.sockets[name].push(s);

    function onFree() {
        self.emit('free', s, host, port, localAddress);
    }
    s.on('free', onFree);

    function onClose(err) {
        // This is the only place where sockets get removed from the Agent.
        // If you want to remove a socket from the pool, just close it.
        // All socket errors end in a close event anyway.
        self.removeSocket(s, name, host, port, localAddress);
    }
    s.on('close', onClose);

    function onRemove() {
        // We need this function for cases like HTTP 'upgrade'
        // (defined by WebSockets) where we need to remove a socket from the pool
        //  because it'll be locked up indefinitely
        self.removeSocket(s, name, host, port, localAddress);
        s.removeListener('close', onClose);
        s.removeListener('free', onFree);
        s.removeListener('agentRemove', onRemove);
    }
    s.on('agentRemove', onRemove);
    return s;
};

Agent.prototype.removeSocket = function(s, name, host, port, localAddress) {
    if (this.sockets[name]) {
        var index = this.sockets[name].indexOf(s);
        if (index !== -1) {
            this.sockets[name].splice(index, 1);
            if (this.sockets[name].length === 0) {
                // don't leak
                delete this.sockets[name];
            }
        }
    }
    if (this.requests[name] && this.requests[name].length) {
        var req = this.requests[name][0];
        // If we have pending requests and a socket gets closed a new one
        this.createSocket(name, host, port, localAddress, req).emit('free');
    }
};

Agent.prototype.destroy = function() {
    var sets = [this.freeSockets, this.sockets];
    sets.forEach(function(set) {
        Object.keys(set).forEach(function(name) {
            set[name].forEach(function(socket) {
                socket.destroy();
            });
        });
    });
};

//HttpClient.DefaultAgent = Agent;