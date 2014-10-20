var storage = require('node-persist'),
    request = require('request'),
    async = require('async'),
    Q = require('q');

storage.initSync({
    dir: 'articles'
});

(function mainLoop() {
    getLatestMaxitem().then(function(endId) {
        var startId = getLastSavedMaxitem() || endId;

        if(startId !== endId) {
            getAndSaveNewArticles(startId, endId).then(function(newArticles) {
                saveLatestMaxItem(endId);
                postNewArticlesToNotifier(newArticles);

                setTimeout(mainLoop, 120000);
            });
        }
    })
})();

function getAndSaveNewArticles(startId, endId) {
    var currId = startId,
        newArticles = [],
        deferred = Q.defer();;

    async.whilst(function () {
            return currId <= endId;
        },
        function (next) {
            request.get({
                'url' : "https://hacker-news.firebaseio.com/v0/item/" + currId + ".json?print=pretty",
                'json' : true
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    if(body.type === 'story') {
                        newArticles.push(body);
                    }
                }
                currId++;
                next();
            });
        },
        function (err) {
            if(err) {
                console.log(err);
                deferred.reject();
            } else {
                if(newArticles.length) {
                    saveNewArticles(newArticles);
                    deferred.resolve(newArticles);
                }
            }
        })

    return deferred.promise;
}

function postNewArticlesToNotifier(newArticles) {
    request({
        url: 'http://localhost:5555' + '/newArticles',
        json: true,
        method: 'POST',
        body: newArticles
    }, function (err) {
        if(err) {
            console.log(err);
        }
    });
}

function getLastSavedMaxitem() {
    var articlesJSON = storage.getItem('articles.json') || {},
        lastSavedMaxitem = articlesJSON['lastSavedMaxitem'];

    return lastSavedMaxitem;
}


function getLatestMaxitem() {
    var deferred = Q.defer();

    request("https://hacker-news.firebaseio.com/v0/maxitem.json", function (error, response, body) {
        if (error) {
            deferred.reject(error);
        } else {
            deferred.resolve(parseInt(body));
        }
    });

    return deferred.promise;
}

function saveLatestMaxItem(maxItemId) {
    var articlesJSON = storage.getItem('articles.json') || {};
    articlesJSON['lastSavedMaxitem'] = maxItemId;

    storage.setItem('articles.json', articlesJSON);
}

function saveNewArticles(newArticles) {
    var articlesJSON = storage.getItem('articles.json') || {};

    articlesJSON['articles'] = newArticles;
    storage.setItem('articles.json', articlesJSON);
}
