var util = Npm.require('util');

console.inspect = function(obj){
    console.log( util.inspect(obj,{showHidden:true,colors:true}) );
};