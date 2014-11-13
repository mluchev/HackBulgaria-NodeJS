module.exports = (function() {
    var bodyParser = require('body-parser'),
        express = require('express'),
        _ = require('underscore'),
        app = express(),
        Q = require('q'),
        persistence = require('./persistence');

    app.use(bodyParser.json());

    app.post('/createContact', function(req, res) {
        persistence.createContact(req.body.phoneNumber, req.body.personIdentifier).then(function(result) {
            if(result){
                res.json(result[0]);
            } else {
                res.json({});
            }
        });
    });


    app.get('/allContacts', function(req, res) {
        persistence.getAllContacts().then(function(contacts) {
            if(contacts) {
                res.json(contacts);
            } else {
                res.json({});
            }
        });
    });


    app.get('/contact', function(req, res) {
        persistence.getContact(req.query.personIdentifier).then(function(contact) {
            if(contact) {
                res.json(contact);
            } else {
                res.json({});
            }
        });
    });

    app.delete('/deleteContact', function(req, res) {
        persistence.deleteContact(req.body.personIdentifier).then(function(numOfDeletedDocs) {
            if(numOfDeletedDocs){
                res.json({numOfDeletedDocs:  numOfDeletedDocs});
            } else {
                res.json({});
            }
        });
    });

    app.listen(5002);

    return app;
})();