// TODO connection should not be created on every request

module.exports = (function () {
    var configJson = require('./config.json'),
        MongoClient = require('mongodb').MongoClient,
        Q = require('q'),
        module = {};

    module.getGraphByUserAndDepth = function(username, depth) {
        var deferred = Q.defer();
        MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
            if (err) {
                console.log(err);
                deferred.reject();
            } else {
                db.collection('graphs').findOne({
                    username: username,
                    depth: depth
                }, function(err, result){
                    if (err) {
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
    };

    module.getGraphById = function(graphId) {
        var deferred = Q.defer();
        MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
            if (err) {
                console.log(err);
                deferred.reject();
            } else {
                db.collection('graphs').findOne({
                    graphId: graphId
                }, function(err, result){
                    if (err) {
                        deferred.reject();
                        console.log(err);
                    } else {
                        console.log(result);
                        deferred.resolve(result);
                    }
                    db.close();
                });
            }
        });

        return deferred.promise;
    };

    module.saveGraph = function(graphBuilder) {
        var deferred = Q.defer();

        MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
            if (err) {
                console.log(err);
                deferred.reject();
            } else {
                graphBuilder.isGraphFullyBuilt = true;

                db.collection('graphs').insert(graphBuilder, function (err, result) {
                    if (err) {
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
    };

    return module;
}());