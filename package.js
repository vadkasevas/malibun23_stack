Package.describe({
    name: 'malibun23:stack',
    version: '0.0.35',
    summary: 'collection and schema extension',
    git: 'https://github.com/vadkasevas/malibun23_stack',
    documentation: null
});

Npm.depends({
    "mkdirp":"0.5.1",
    "async": "2.1.4",
    "node.extend":"1.1.6",
    "node-uuid":"1.4.2",
    "safetydance":"0.1.1",
    "path":"0.11.14",
    "request":"2.60.0",
    "tough-cookie":"2.2.0",
    "https-proxy-agent":"1.0.0",
    "proxy-agent":"https://github.com/vadkasevas/node-proxy-agent/tarball/42fc91bf96ebf67753cdcdc3aaef2b0fa3dfce36",
    "native-dns":"0.7.0",
    "iconv-lite":"0.4.13",
    "agentkeepalive":"2.1.1",
    "cheerio": "0.22.0",
    "random-useragent":"0.3.1",
    "http-proxy": "1.8.1",
    "portscanner": "1.0.0",
    "esprima": "4.0.0",
    "babel-plugin-transform-decorators-legacy": "1.3.4"
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.1');
    api.use('accounts-base');
    api.use('meteor-base');
    api.use('accounts-password');
    api.use('mongo');
    api.use('ecmascript');
    api.use('stevezhu:lodash@4.17.2');
    api.use('underscore@1.0.9');
    api.use('momentjs:moment@2.8.4');
    api.use('rzymek:moment-locale-ru@2.8.4');
    api.use('jparker:crypto-core@0.1.0');
    api.use('jparker:crypto-md5@0.1.1');
    api.use('jparker:crypto-sha256@0.1.1');
    api.use('raix:eventemitter@0.1.3');
    api.use('alanning:roles@1.2.15');
    api.use('templating', 'client');
    api.use('aldeed:collection2@2.10.0');
    api.use('aldeed:simple-schema@1.5.3',['client','server']);
    api.use('vazco:universe-autoform-select@0.3.10');
    api.use('chuangbo:cookie@1.1.0');
    api.use('session@1.1.6');
    //httpclient
    api.use(['url'],['server']);
    api.use('patte:mime-npm@0.0.1',['server']);
    api.use('cfs:power-queue@0.0.1',['server']);
    api.use('cfs:micro-queue@0.0.6',['server']);
    api.use('cfs:reactive-list@0.0.9',['server']);
    //cluster
    api.use(['webapp'], 'server');
    api.use('iron:router@1.0.13');
    api.use('monbro:iron-router-breadcrumb@1.0.10');
    api.use('aldeed:autoform@5.8.1','client');
    api.use('check@1.2.5');
    api.use('aldeed:simple-schema@1.5.3');
    api.addFiles(['utils/lib/component.js'],['server','client']);

    api.export(['component'],['client','server']);

    api.addFiles('utils/mongo/CollectionPermissions.js',['client','server']);


    api.addFiles(['utils/client/esprima.min.js'],['client']);

    api.addFiles([
            ,'lib/globals','lib/host','lib/dateUtils','lib/meteorUtils','lib/mongoUtils','lib/numberUtils','lib/objectUtils','lib/stringUtils','lib/startup','lib/safe'
            ,'lib/roles','lib/malibunController'
            ,'mongo/SchemaBuilder','mongo/MalibunCollection','mongo/Schemas','lib/MalibunEnum','lib/MalibunProgress','lib/MalibunCache'
        ].map(function(name){return 'utils/'+name+'.js'})
        ,['server','client']
    );
    api.export([
            'component',
            'Roles','__','inspect','safe',
            'formatRuDateTime','formatRuDateTimeMS','formatRuDate','inDateRange','getNowDateRound','getNowTime','deserializeDate','deserializeDates',
            'throttle',
            'cursorForEachChunked','eachCursorChunk',
            'rndInt','inRange',

            'extend','md5','isset','objectSize','firstKey','randKey','randValue','eachObjectField','generateRandomHash','safeGet','randArrValue',
            'formatDate','formatRuBoolean','deserializeDate','deserializeDates','keyValueChunks','filterArray','minValue','minKey','inArray','keyValueChunks',
            'trimSlashes','getRandHash','joinObject',

            'trim','generateRndString','formatRuBoolean','stringify','unicode','htmlspecialchars_decode','htmlspecialchars_encode','capitalize','firstLower','preg_match_all',
            'parse_cookies',

            'SchemaBuilder', 'Schemas','MalibunCollection','MalibunModel','MalibunController','action','MalibunAction',

            'MalibunEnum','MalibunEnumItem','MalibunProgress',

            'clearHelperArguments',

            'MalibunCache'
        ]
        , ['client', 'server']
    );
    api.addFiles([
        'utils/client/helpers/globalHelpers.js','utils/client/deleteButton.html','utils/client/deleteButton.events.js',
        'utils/client/spoiler/spoiler.css','utils/client/spoiler/spoiler.html','utils/client/spoiler/spoiler.js',
    ],['client']);

    api.addFiles(['core','MalibunPromise','fileUtils','meteorUtils','esCore','meteorAsync','globals',
            'MongoLock','lineReader','MalibunHook','WrappedEventEmitter','MalibunStorage'
        ].map(function(name){return 'utils/server/'+name+'.js'}) ,['server']
    );
    api.export([
            'fileExists','dirExists','mkdir','readFileSync','MalibunPromise','meteorAsync','doWhile',
            'npmFs','npmOs','npmPath','npmFibers','inherits','TraceError','MongoLock','MongoLockPromise',
            'lineReader','safetydance','UUID','MIME', 'CollectionPermissions','MalibunHook','WrappedEventEmitter',
            'MalibunStorage','MalibunCache'
        ],
        ['server']
    );

    api.addFiles(['utils/client/Base64.js','utils/client/pretty.js'],['client']);
    api.export(['Base64','pretty'],['client']);

    api.addFiles(['httpcall','HttpClient','MultipartFile','utils','waitFreeProxies'
        ,'httpAgent','overrideDns','HttpContext'
        ,'HtmlForm','RecaptchaSolver','Google',
        'AutoencodingHttpClient','queue','UserAgent','captcha/Antigate','captcha/RuCaptcha'
    ].map(function(name){return 'httpclient/server/'+name+'.js'}) ,['server']);

    api.export(['HttpClient','MultipartFile','HttpContext','HtmlForm','RecaptchaSolver',
        'AutoencodingHttpClient','google','UserAgent','Antigate','RuCaptcha'],['server']);

    api.addFiles(['stat/MalibunStats.js','stat/schema.js'], ['server', 'client']);
    api.addFiles(['stat/startup.js'], ['server']);
    api.export(['MalibunStats','MalibunStatsModel'],['server']);

    api.addFiles([
        'malibuncluster/MalibunServerGroups.js', 'malibuncluster/MalibunServers.js','malibuncluster/Cluster.js',
    ], ['server', 'client']);

    api.addFiles([
        'malibuncluster/simplecluster/worker_pool.js',
        'malibuncluster/simplecluster/workers.js',
        'malibuncluster/server/prototype.js',
        'malibuncluster/server/startup.js',
    ], ['server']);

    api.addFiles([
        'malibuncluster/client/helpers.js'
    ],['client']);
    api.export(['MalibunServerGroups','Cluster','MalibunServers','MalibunServersModel'],['server', 'client']);

    api.export([
        'SchemaBuilder','MalibunCollection','MalibunModel','MalibunController','action','MalibunAction',
        'MalibunEnum','MalibunEnumItem','MalibunProgress','MalibunCache'
    ]);

    api.export([
            'MongoLock','MongoLockPromise', 'CollectionPermissions','WrappedEventEmitter',
            'MalibunCache','MalibunStats','MalibunStatsModel'
        ],
        ['server']
    );

    api.export(['MalibunServerGroups','MalibunServers','MalibunServersModel'],['server', 'client']);

});

Package.onTest(function(api) {
    api.use('malibun23:stack');
    api.use(['ecmascript', 'cultofcoders:mocha','practicalmeteor:chai','aldeed:simple-schema@1.5.3']);

    api.addFiles('tests/schemas.js');
});
