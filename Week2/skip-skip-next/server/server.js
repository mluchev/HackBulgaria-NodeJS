var express = require("express"),
    configJson = require('./config.json'),
    mongodb = require('mongodb'),
    Q = require('q'),
    app = express(),
    MongoClient = require('mongodb').MongoClient;

app.all("*", function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", ["X-Requested-With", "Content-Type", "Access-Control-Allow-Methods"]);
    res.header("Access-Control-Allow-Methods", ["GET"]);
    next();
});

app.get("/keywords", function(req, res) {
    var fromPos = recalculateFromPos(parseInt(req.query.fromPosition), req.query.direction);

    getHistogram(fromPos).then(function(filteredKeywords) {
        res.json(filteredKeywords);
    }, function() {
        res.end();
    });
});

app.listen(8000);

function getHistogram(fromPos) {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            db.collection('histogram')
                .find()
                .sort({ count: -1})
                .skip(fromPos)
                .limit(10)
                .toArray(function(err, result) {
                    result.forEach(function(sub, index) {
                        sub.rank = fromPos + index + 1;
                    });
                    deferred.resolve(result);

                    db.close();
            });
        }
    });

    return deferred.promise;
}


function recalculateFromPos(fromPos, direction) {
    var recalculatedFromPos;

    if(fromPos) {
        if(direction === 'prev') {
            recalculatedFromPos = (fromPos - 20 >= 0) ? fromPos - 20 : 0;
        } else {
            recalculatedFromPos = fromPos;
        }
    } else {
        recalculatedFromPos = 0;
    }

    return recalculatedFromPos;
}
