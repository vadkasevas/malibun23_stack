npmFibers = Npm.require('fibers');
npmOs = Npm.require('os');
npmFs = Npm.require('fs');
npmPath = Npm.require('path');
inherits = Npm.require('util').inherits;
safetydance = Npm.require('safetydance');
util = Npm.require('util');

inspect = function(obj){
    console.log( util.inspect( obj ) );
};

//TraceError = Npm.require('trace-error');
//import TraceError from 'trace-error';
//global.TraceError = TraceError;
