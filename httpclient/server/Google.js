var request = Npm.require('request');
var cheerio = Npm.require('cheerio');
var querystring = Npm.require('querystring');
var util = Npm.require('util');

var linkSel = 'h3.r a';
var descSel = 'div.s';
var itemSel = 'div.g';
var nextSel = 'td.b a span';

var URL = 'https://www.google.%s/search?hl=%s&q=%s&start=%s&sa=N&num=%s&ie=UTF-8&oe=UTF-8&gws_rd=ssl';

var nextTextErrorMsg = 'Translate `google.nextText` option to selected language to detect next results link.';
/*
 options.query
 options.start
 options.resultsPerPage
 options.timeSpan
 options.httpContext
 */
google = function (options, callback) {
    options = typeof(options)=='string' ? {query:options} : options;
    var query = options.query;
    var start = options.start || 0;
    var resultsPerPage = options.resultsPerPage || 10;
    if (resultsPerPage > 100) resultsPerPage = 100; // Google won't allow greater than 100 anyway
    if (google.lang !== 'en' && google.nextText === 'Next') console.warn(nextTextErrorMsg)
    if (options.timeSpan) {
        URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + options.timeSpan) : URL.concat('&tbs=qdr:', options.timeSpan);
    }

    var newUrl = util.format(URL, google.tld, google.lang, querystring.escape(query), start, resultsPerPage);
    HttpClient.forOptions({
        url:newUrl,
        context:options.httpContext || undefined,
        followLocation:true,
    }).execute().then(function(err,content,client){
        var statusCode = content ? content.statusCode : 0;
        var body = content ? content.content : '';
        if ((err == null) && statusCode === 200) {
            var $ = cheerio.load(body)
            var res = {
                url: newUrl,
                query: query,
                start: start,
                links: [],
                $: $,
                body: body
            };

            $(itemSel).each(function (i, elem) {
                var linkElem = $(elem).find(linkSel);
                var descElem = $(elem).find(descSel);
                var item = {
                    title: $(linkElem).first().text(),
                    link: null,
                    description: null,
                    href: null
                };
                var qsObj = querystring.parse($(linkElem).attr('href'));
                if (qsObj&&qsObj['/url?q']) {
                    item.link = qsObj['/url?q'];
                }else{
                    item.link = $(linkElem).attr('href');
                }
                item.href = item.link;
                $(descElem).find('div').remove();
                item.description = $(descElem).text();

                res.links.push(item);
            });


            if ($(nextSel).last().text() === google.nextText) {
                var nextOptions = _.extend({},options);
                nextOptions.start = start+resultsPerPage;
                res.next = function () {
                    google(nextOptions, callback)
                }
            }

            callback(null, res)
        } else {
            callback(new Error('Error on response' + (content ? ' (' + content.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
        }
    });
};

google.tld = 'com';
google.lang = 'en';
google.nextText = 'Next';
