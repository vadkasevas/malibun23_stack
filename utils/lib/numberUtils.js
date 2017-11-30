rndInt = function(min, max){
    if(max===undefined){
        max = min;
        min = 0;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

inRange = function(value,from,to){
    var min = Math.min(from,to);
    var max = Math.max(from,to);
    if(value<min)
        return false;
    if(value>max)
        return false;
    return true;
};





