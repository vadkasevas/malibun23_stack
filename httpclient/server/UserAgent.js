var random_useragent = Npm.require('random-useragent');

UserAgent = {
    rndUserAgent:function(){
        return random_useragent.getRandom();
    }
}

