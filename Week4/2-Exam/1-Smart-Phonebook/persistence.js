module.exports = (function () {
    var configJson = require('./config.json'),
        MongoClient = require('mongodb').MongoClient,
        Levenshtein = require('levenshtein'),
        Q = require('q'),
        db,
        module = {};

    function getDbConnection() {
        var deferred = Q.defer();

        if(db) {
            deferred.resolve(db);
        } else {
            MongoClient.connect(configJson.mongoConnectionUrl, function (err, database) {
                if (err) {
                    console.log(err);
                    deferred.reject();
                } else {
                    db = database;
                    deferred.resolve(database);
                }
            });
        }

        return deferred.promise;
    }

    module.createContact = function(phoneNumber, personIdentifier) {
        var deferred = Q.defer();

        getDbConnection().then(function(db) {
            db.collection('contacts').insert({
                phoneNumber: phoneNumber,
                personIdentifier: personIdentifier
            }, function (err, result) {
                if (err) {
                    deferred.reject();
                    console.log(err);
                } else {
                    deferred.resolve(result);
                }
            });
        });

        return deferred.promise;
    };

    module.getAllContacts = function() {
        var deferred = Q.defer();

        getDbConnection().then(function(db) {
            db.collection('contacts').find().toArray(function (err, result) {
                if (err) {
                    deferred.reject();
                    console.log(err);
                } else {
                    deferred.resolve(result);
                }
            });
        });

        return deferred.promise;
    };

    module.getContact = function(personIdentifier) {
        var deferred = Q.defer();

        getDbConnection().then(function(db) {
            db.collection('contacts').findOne({personIdentifier: personIdentifier}, function (err, result) {
                if (err) {
                    deferred.reject();
                    console.log(err);
                } else {
                    deferred.resolve(result);
                }
            });
        });

        return deferred.promise;
    };

    module.deleteContact = function(personIdentifier) {
        var deferred = Q.defer();

        getDbConnection().then(function(db) {
            db.collection('contacts').remove({personIdentifier: personIdentifier}, function (err, numberOfRemovedDocs) {
                if (err) {
                    deferred.reject();
                    console.log(err);
                } else {
                    deferred.resolve(numberOfRemovedDocs);
                }
            });
        });

        return deferred.promise;
    };


    return module;
}());