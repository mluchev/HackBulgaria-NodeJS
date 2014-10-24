var storage = require('node-persist'),
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    async = require('async'),
    natural = require('natural'),
    Q = require('q'),
    app = express(),
    tokenizer = new natural.WordTokenizer();

storage.initSync({
    dir: 'histogram'
});

app.use(bodyParser.json());


(function mainLoop(nextId) {
    var currId = nextId || getLastSavedId();

    getArticle(currId).then(function(article) {
        processArticle(article);
        saveLastId(currId);


        setTimeout(function() {
            mainLoop(currId + 1)
        }, 0);
    });
})();

app.get('/keywords', function(req, res) {
    var histogram = getStoredHistogram();

   res.json(histogram);
});

function processArticle(article) {
    var textSource = (article.title || '') + ' '
            +  (article.text || '');

    updateHistogramWordsCount(textSource);
}

function updateHistogramWordsCount(sourceText) {
    var histogram = getStoredHistogram();

    tokenizer.tokenize(sourceText.toLowerCase()).forEach(function(word) {
//        if(isNaN(word)) {
            if(histogram[word]) {
                histogram[word]++;
            } else {
                histogram[word] = 1;
            }
//        }
    });

    saveHistogram(histogram);
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
            console.log(body);
            deferred.resolve(body);
        }
    });

    return deferred.promise;
}

function getStoredHistogram() {
    var histogramJson = storage.getItem('histogram.json') || {};

    return histogramJson;
}

function saveHistogram(histogram) {
    storage.setItem('histogram.json', histogram);
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

app.listen(1234);

