var storage = require('node-persist'),
    request = require('request'),
    async = require('async'),
    configJson = require('./../config.json'),
    mongodb = require('mongodb'),
    MongoClient = require('mongodb').MongoClient,
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
        deferred = Q.defer();

    async.whilst(function () {
            return currId <= endId;
        },
        function (next) {
            request.get({
                'url' : "https://hacker-news.firebaseio.com/v0/item/" + currId + ".json?print=pretty",
                'json' : true
            }, function (error, response, body) {
                if (!error) {
                    if (body.type === 'comment') {
                        findCommentsStory(body).then(function (res) {
                            body.storyUrl = res.url;

                            newArticles.push(body);
                            currId++;
                            next();
                        }, function() {
                            newArticles.push(body);
                            currId++;
                            next();
                        });

                    } else if (body.type === 'story') {
                        newArticles.push(body);
                        currId++;
                        next();
                    } else {
                        currId++;
                        next();
                    }
                }
            });
        }, function (err) {
            if(err) {
                console.log(err);
                deferred.reject();
            } else {
                if(newArticles.length) {
                    saveNewArticles(newArticles);
                    deferred.resolve(newArticles);
                }
            }
        });

    return deferred.promise;
}

function findCommentsStory(article) {
    var deferred = Q.defer();

    if(article.type === 'story') {
        return article;
    } else {
        request.get({
            'url' : "https://hacker-news.firebaseio.com/v0/item/" + article.parent + ".json?print=pretty",
            'json' : true
        }, function (error, response, body) {
            if (error) {
                deferred.reject();
            } else {
                deferred.resolve(findCommentsStory(body));
            }
        });
    }

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
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        var collection;

        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            collection = db.collection('articles');
            collection.insert(newArticles, function(err, result) {
                if(!err) {
                    console.log("New articles inserted.");
                }
            });
        }
    });

    return deferred.promise;
}