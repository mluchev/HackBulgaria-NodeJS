var mongodb = require('mongodb'),
    fileArg = process.argv[2],
    configJson = require('./config.json'),
    peopleJson = require('./' + fileArg),
    path = require('path'),
    MongoClient = require('mongodb').MongoClient;


// Use connect method to connect to the Server
MongoClient.connect(configJson.mongoConnectionUrl, function(err, db) {
    var collectionName = path.basename(fileArg, '.json'),
        collection = db.collection(collectionName);

    collection.insert(peopleJson, function(err, result) {
        console.log(err || '');
        console.log(result || '');

        db.close();
    });
});