formatDate = function(date,format){
    return moment(date).tz('Europe/Moscow').format(format);
};

formatRuDateTime = function(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
};

formatRuDateTimeMS = function(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss SSS');
};

formatRuDate = function(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD');
};

inDateRange = function(date,dateFrom,dateTo){
    if((dateFrom&&date)&&dateFrom.getTime()>date.getTime())
        return false;
    if(dateTo&&date&&dateTo.getTime()<date.getTime())
        return false;
    return true;
};

getNowDateRound = function(){
    var timestamp = Math.round(new Date() / 1000)*1000;
    return new Date(timestamp);
};

getNowTime = function(){
    return (new Date()).getTime();
};

deserializeDate = function(dateS){
    if (typeof dateS === 'string') {
        var a = deserializeDate.reISO.exec(dateS);
        if (a) {
            return new Date(dateS);
        }
    }
    return dateS;
};
deserializeDate.reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

deserializeDates = function(obj){
    if(obj instanceof Date)
        return obj;

    if(Array.isArray(obj)){
        var clone = [];
        _.each(obj,function(val,index){
            clone[index] =  deserializeDates(val);
        });
        return clone;
    }else if(typeof obj === 'string'){
        return deserializeDate(obj);
    }
    else if( (obj instanceof Object) ) {
        var clone = {};
        for (var key in obj) {
            clone[key] = deserializeDates(obj[key]);
        }
        return clone;
    }
    return obj;
};