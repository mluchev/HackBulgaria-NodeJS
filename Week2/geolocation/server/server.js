var bodyParser = require('body-parser'),
    express = require('express'),
    app = express(),
    mongodb = require('mongodb'),
    Q = require('q'),
    configJson = require('./config.json'),
    MongoClient = require('mongodb').MongoClient;

app.all("*", function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", ["X-Requested-With", "Content-Type", "Access-Control-Allow-Methods", "query-json-header"]);
    res.header("Access-Control-Allow-Methods", ["GET", "POST"]);
    next();
});

app.use(bodyParser.json());

app.post('/locations', function(req, res) {
    console.dir(req.body);
    addLocation(req.body).then(function() {
        res.end();
    }, function() {
        res.end();
    });
});

app.get('/locations', function(req, res) {
    var query = req.headers['query-json-header'];

    getAllMatchingLocations(JSON.parse(query)).then(function(locations) {
        res.json(locations);
    }, function() {
        res.end();
    });
});

app.listen(4444);


function getAllMatchingLocations(query) {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            //convert the object position to  GeoJSON Point
            query.position = {
                type: "Point",
                coordinates: [ query.position.lng, query.position.lat ]
            };

            db.collection('locations').ensureIndex( { position : "2dsphere" },  function() {} );

            db.collection('locations').find({
                $and: [
                    {
                        position: {
                            $near: { $geometry: query.position, $maxDistance: query.range * 1000}
                        }
                    },
                    {
                        tags : {
                            $all: query.tags
                        }
                    }
                ]
            }).toArray(function(err, result) {
                if(err) {
                    deferred.reject();
                    console.log(err);
                } else {
                    deferred.resolve(result);
                    db.close();
                }
            });
        }
    });
    return deferred.promise;
}

function addLocation(location) {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        if (err) {
            console.log(err);
            deferred.reject();
        } else {

            //convert the object position to  GeoJSON Point
            location.position = {
                type: "Point",
                coordinates: [ location.position.lng, location.position.lat ]
            };

            db.collection('locations').insert(location, function(err, result) {
                if(err) {
                    deferred.reject();
                    console.log(err);
                } else {
                    deferred.resolve(result);
                }
                db.close();
            });
        }
    });

    return deferred.promise;
}


