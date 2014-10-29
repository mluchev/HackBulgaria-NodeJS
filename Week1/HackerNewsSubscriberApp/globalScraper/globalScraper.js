var storage = require('node-persist'),
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    natural = require('natural'),
    Q = require('q'),
    mongodb = require('mongodb'),
    configJson = require('./../config.json'),
    MongoClient = require('mongodb').MongoClient,
    app = express(),
    tokenizer = new natural.WordTokenizer();

storage.initSync({
    dir: 'histogram'
});

app.use(bodyParser.json());

app.get('/keywords', function(req, res) {
    getStoredHistogram().then(function(histogram) {
        res.json(histogram);
    }, function() {
        res.end();
    });
});

app.listen(1234);

(function mainLoop(nextId) {
    var currId = nextId || getLastSavedId();


    getArticle(currId).then(function(article) {
        processArticle(article).then(function() {
            saveLastId(currId);

            setTimeout(function() {
                mainLoop(currId + 1);
            }, 0);
        });

    }, function() {
        setTimeout(function() {
            mainLoop(currId + 1);
        }, 0);
    });
})();

function processArticle(article) {

    var textSource = (article.title || '') + ' '
            +  (article.text || ''),
    sourceTextWordHash = getSourceTextWordsHash(textSource);
    return updateHistogram(sourceTextWordHash);
}

function getSourceTextWordsHash(sourceText) {

    var sourceTextWordHash = {};

    tokenizer.tokenize(sourceText.toLowerCase()).forEach(function(word) {
        if(isNaN(word)) {
            if(sourceTextWordHash[word]) {
                sourceTextWordHash[word]++;
            } else {
                sourceTextWordHash[word] = 1;
            }
        }
    });
    return sourceTextWordHash;
}

function getArticle(id) {
    var deferred = Q.defer();

    request.get({
        'url' : "https://hacker-news.firebaseio.com/v0/item/" + id + ".json?print=pretty",
        'json' : true
    }, function (error, response, body) {
        if (error) {
            console.log(error);
            deferred.reject();
        } else {
            deferred.resolve(body);
        }
    });
    return deferred.promise;
}


function getStoredHistogram() {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            db.collection('histogram').find().toArray(function(err, result) {
                if(result) {
                    deferred.resolve(result);
                } else {
                    console.log(err);
                    deferred.reject();
                }

                db.close();
            });
        }
    });
    return deferred.promise;
}

function updateHistogram(newWordsHash) {

        var deferred = Q.defer();

        MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
            var collection,
                pendingDbUpdates = [];

            if (err) {
                console.log(err);
                deferred.reject();
            } else {
                collection = db.collection('histogram');
                Object.keys(newWordsHash).forEach(function(word) {
                    var deferred = Q.defer();
                    pendingDbUpdates.push(deferred.promise);

                    collection.update({ 'keyword' : word },  { $inc: { count: newWordsHash[word] }},
                        { upsert: true },
                        function(err, result) {
                            if(result) {
                                deferred.resolve(result);
                            } else {
                                console.log(err);
                                deferred.reject();
                            }

                        }
                    );
                });

                Q.all(pendingDbUpdates).then(function() {
                    deferred.resolve();
                }, function() {
                    deferred.reject();
                });

                db.close();
            }
        });
    return deferred.promise;
}


function getLastSavedId() {

    var lastIdJson = storage.getItem('lastId.json') || {},
        lastId = lastIdJson['lastId'] || 1;
    return lastId;
}

function saveLastId(lastId) {

    var lastIdJson = storage.getItem('lastId.json') || {};
    lastIdJson['lastId'] = lastId;
    storage.setItem('lastId.json', lastIdJson);
}


