unicode = {
    escape: function(s) {
        return s.replace(/^[-~]|\\/g, function(m) {
            var code = m.charCodeAt(0);
            return '\\u' + ((code < 0x10) ? '000' : ((code < 0x100) ? '00' : ((code < 0x1000) ? '0' : ''))) + code.toString(16);
        });
    },
    unescape : function (s) {
        return s.replace(/\\u([a-fA-F0-9]{4})/g, function(matched, g1) {
            return String.fromCharCode(parseInt(g1, 16))
        })
    }
};

trim = function(str){
    if(str==null||str.length==0)
        return str;
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    return str.replace(rtrim, '');
};

generateRndString = function(fromLen,toLen,possible){
    fromLen = fromLen || 1;
    toLen = toLen || 1;
    var len = rndInt(fromLen,toLen);
    var text = "";
    possible = possible || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

formatRuBoolean = function (val) {
    if(val)
        return 'Да';
    else
        return 'Нет';
};

trimSlashes = function(s){
    var result = String(s);
    result = result.replace(/^\/+/gi,'');
    result = result.replace(/\/+$/gi,'');
    return result;
};

htmlspecialchars_decode = function(s) {
    return String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
};

htmlspecialchars_encode = function(s){
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, "&#039;");
};

capitalize = function(string){
    if(!string||string.length<1)
        return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
};

firstLower = function(string){
    if(!string||string.length<1)
        return string;
    return string.charAt(0).toLowerCase() + string.slice(1);
};

parse_cookies=function(s){
    var result = {};
    if(!s||!_.isString(s))
        return result;
    var matches;
    var re = /([^=\s;]+)=([^=\s;]*)/gi;
    while ((matches = re.exec(s)) != null){
        result[ matches[1] ] = matches[2];
    }
    return result;
};