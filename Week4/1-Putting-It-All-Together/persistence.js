module.exports = (function () {
    var configJson = require('./config.json'),
        mongoose = require('mongoose'),
        Q = require('q'),
        keyGenerator = require('generate-key'),
        db = mongoose.connect(configJson.mongoConnectionUrl),
        Schema = mongoose.Schema,
        Snippet = mongoose.model('Snippet', new Schema({
            snippetId: String,
            filename: String,
            content: String,
            creator: String,
            type: String
        })),
        module = {};

    module.saveSnippet = function(snippet) {
        var deferred = Q.defer(),
            newSnippet = new Snippet({
                snippetId: keyGenerator.generateKey(30),
                filename: snippet.filename,
                content: snippet.content,
                creator: snippet.creator,
                type: snippet.type
            });

        if(snippet.filename.split(".")[1] && snippet.type === 'txt') {
            newSnippet.type = snippet.filename.split(".")[1];
        }

        newSnippet.save(function (err, savedSnippet) {
            if (err) {
               console.error(err);
               deferred.reject();
            } else {
                deferred.resolve(savedSnippet.snippetId);
            }
        });

        return deferred.promise;
    };

    module.getAllSnippets = function() {
        var deferred = Q.defer();

        Snippet.find({}, 'filename content creator type', function (err, snippets) {
            if (err) {
                console.error(err);
                deferred.reject();
            } else {
                deferred.resolve(snippets);
            }
        });

        return deferred.promise;
    };

    module.getSnippetsOfCreator = function(creator) {
        var deferred = Q.defer();

        Snippet.find({creator: creator}, 'filename content creator type', function (err, snippets) {
            if (err) {
                console.error(err);
                deferred.reject();
            } else {
                deferred.resolve(snippets);
            }
        });

        return deferred.promise;
    };

    module.getSnippet = function(snippetId) {
        var deferred = Q.defer();

        Snippet.findOne({snippetId: snippetId}, 'filename content creator type', function (err, snippet) {
            if (err) {
                console.error(err);
                deferred.reject();
            } else {
                deferred.resolve(snippet);
            }
        });

        return deferred.promise;
    };

    module.updateSnippet = function(snippetId, snippet) {
        var deferred = Q.defer();

        Snippet.where({ snippetId: snippetId }).update({
            filename: snippet.filename,
            content: snippet.content,
            creator: snippet.creator,
            type: snippet.type
        }, function(err, numOfUpdatedDocs) {
            if (err) {
                console.error(err);
                deferred.reject();
            } else {
                deferred.resolve(numOfUpdatedDocs);
            }
        });

        return deferred.promise;
    };

    module.deleteSnippet = function(snippetId) {
        var deferred = Q.defer();

        Snippet.remove({ snippetId: snippetId }, function(err, snippet) {
            if (err) {
                console.error(err);
                deferred.reject();
            } else {
                deferred.resolve(snippet);
            }
        });

        return deferred.promise;
    };

    return module;
}());