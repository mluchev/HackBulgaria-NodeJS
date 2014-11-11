(function() {
    var bodyParser = require('body-parser'),
        express = require('express'),
        _ = require('underscore'),
        app = express(),
        Q = require('q'),
        persistence = require('./persistence');

    app.use(bodyParser.json());

    app.post('/createSnippet', function(req, res) {
        persistence.saveSnippet(req.body).then(function(result) {
            if(result){
                res.json({'snippetId': result});
            } else {
                res.end();
            }
        });
    });

    app.post('/updateSnippet', function(req, res) {
        persistence.updateSnippet(req.body.snippetId, req.body.snippet).then(function(numOfUpdatedDocs) {
            if(numOfUpdatedDocs){
                res.json({numOfUpdatedDocs:  numOfUpdatedDocs});
            } else {
                res.end();
            }
        });
    });

    app.delete('/deleteSnippet', function(req, res) {
        persistence.deleteSnippet(req.body.snippetId).then(function(numOfDeletedDocs) {
            if(numOfDeletedDocs){
                res.json({numOfDeletedDocs:  numOfDeletedDocs});
            } else {
                res.end();
            }
        });
    });


    app.get('/allSnippets', function(req, res) {
        persistence.getAllSnippets().then(function(snippets) {
            if(snippets) {
                res.json(snippets);
            } else {
                res.end();
            }
        });
    });

    app.get('/snippetsOfCreator', function(req, res) {
        persistence.getSnippetsOfCreator(req.query.creator).then(function(snippet) {
            if(snippet) {
                res.json(snippet);
            } else {
                res.end();
            }
        });
    });

    app.get('/snippet', function(req, res) {
        persistence.getSnippet(req.query.snippetId).then(function(snippet) {
            if(snippet) {
                res.json(snippet);
            } else {
                res.end();
            }
        });
    });

    app.listen(5001);
})();