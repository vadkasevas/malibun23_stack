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
    "esprima": "4.0.0"
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
    api.addFiles('utils/mongo/CollectionPermissions.js','server');


    api.addFiles(['utils/client/esprima.min.js'],['client']);

    api.addFiles([
            'lib/globals', 'lib/dateUtils','lib/meteorUtils','lib/mongoUtils','lib/numberUtils'
            ,'lib/objectUtils','lib/stringUtils','lib/startup','lib/safe','lib/roles'
            ,'mongo/SchemaBuilder','mongo/MalibunCollection','mongo/Schemas','lib/MalibunEnum','lib/MalibunProgress','lib/MalibunCache'
        ].map(function(name){return 'utils/'+name+'.js'})
        ,['server','client']
    );
    api.export([
            'Roles','__','inspect','safe',
            'formatRuDateTime','formatRuDateTimeMS','formatRuDate','inDateRange','getNowDateRound','deserializeDate','deserializeDates',
            'throttle','component',
            'cursorForEachChunked','eachCursorChunk',
            'rndInt','inRange',

            'extend','md5','isset','randKey','randValue','eachObjectField','generateRandomHash','safeGet',
            'formatDate','formatRuBoolean','deserializeDate','deserializeDates','keyValueChunks','filterArray','minValue','minKey','inArray','keyValueChunks',
            'trimSlashes','getRandHash','joinObject',

            'trim','generateRndString','formatRuBoolean','stringify','unicode','htmlspecialchars_decode','htmlspecialchars_encode','capitalize','firstLower',
            'parse_cookies',

            'SchemaBuilder', 'Schemas','MalibunCollection','MalibunModel',

            'MalibunEnum','MalibunEnumItem','MalibunProgress',

            'clearHelperArguments',

            'MalibunCache'
        ]
        , ['client', 'server']
    );

    api.addFiles(['core','MalibunPromise','fileUtils','meteorUtils','esCore','meteorAsync','globals',
            'MalibunHook','WrappedEventEmitter','MalibunStorage'
        ].map(function(name){return 'utils/server/'+name+'.js'}) ,['server']
    );
    api.export([
            'fileExists','dirExists','mkdir','readFileSync','MalibunPromise','meteorAsync','doWhile',
            'npmFs','npmOs','npmPath','npmFibers','inherits','TraceError',
            'safetydance','UUID','MIME', 'CollectionPermissions','MalibunHook','WrappedEventEmitter',
            'MalibunStorage','MalibunCache'
        ],
        ['server']
    );

    api.addFiles(['utils/client/Base64.js','utils/client/pretty.js'],['client']);
    api.export(['Base64','pretty'],['client']);

    api.addFiles(['httpcall','HttpClient','MultipartFile','utils'
        ,'httpAgent','overrideDns','HttpContext'
        ,'AutoencodingHttpClient'
    ].map(function(name){return 'httpclient/server/'+name+'.js'}) ,['server']);

    api.export(['HttpClient','MultipartFile','HttpContext',
        'AutoencodingHttpClient'],['server']);

    api.addFiles([
        'malibuncluster/MalibunServerGroups.js', 'malibuncluster/MalibunServers.js','malibuncluster/Cluster.js',
    ], ['server', 'client']);

    api.addFiles([
        'malibuncluster/simplecluster/worker_pool.js',
        'malibuncluster/simplecluster/workers.js',
        'malibuncluster/server/prototype.js',
        'malibuncluster/server/startup.js',
    ], ['server']);

    api.export(['MalibunServerGroups','Cluster','MalibunServers','MalibunServersModel'],['server', 'client']);

    api.export([
        'SchemaBuilder','MalibunCollection','MalibunModel',
        'MalibunEnum','MalibunEnumItem','MalibunProgress','MalibunCache'
    ]);

    api.export([
            'CollectionPermissions','WrappedEventEmitter','MalibunCache'
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
