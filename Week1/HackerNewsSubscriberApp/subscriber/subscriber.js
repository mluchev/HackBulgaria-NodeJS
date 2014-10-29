var storage = require('node-persist'),
    bodyParser = require('body-parser'),
    express = require('express'),
    keyGenerator = require('generate-key'),
    nodeMailer = require('nodemailer'),
    _ = require('underscore'),
    app = express(),
    mongodb = require('mongodb'),
    Q = require('q'),
    configJson = require('./../config.json'),
    MongoClient = require('mongodb').MongoClient,
    transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'mluchev@gmail.com',
            pass: '1111'
        }
    });

app.use(bodyParser.json());

storage.initSync({
    dir: 'subscribers'
});

app.post('/subscribe', function(req, res) {
    var newSubscriber = req.body;

    newSubscriber.subscriberKey = keyGenerator.generateKey(30);
    newSubscriber.confirmationKey = keyGenerator.generateKey(30);

    addSubscriber(newSubscriber).then(function() {
        sendConfirmationEmail(newSubscriber.email, newSubscriber.subscriberKey, newSubscriber.confirmationKey);

        res.json({'key': newSubscriber.subscriberKey});
    });
});


app.post('/unsubscribe', function(req, res) {
    removeSubscriberById(req.body.subscriberKey).then(function() {
        res.end('Subscriber deleted.');
    });
});

app.get('/listSubscribers', function(req, res) {
    getAllSubscribersFromDb().then(function(allSubscribers) {
        res.json(allSubscribers);
    });
});

app.get('/confirmSubscription', function(req, res) {
    unsetSubscriberConfirmationKey(req.query.subscriberKey, req.query.confirmationKey).then(function() {
        res.end('Subscription confirmed.');
    }, function() {
        res.end('Subscription failed.');
    });
});

app.listen(9090);


function getAllSubscribersFromDb() {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        var collection;

        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            collection = db.collection('subscribers');
            collection.find().toArray(function(err, result) {
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

function removeSubscriberById(subId) {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        var collection;

        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            collection = db.collection('subscribers');
            collection.remove({subscriberKey: subId}, function(err, result) {
                if(err) {
                    console.log(err);
                    deferred.reject();
                } else {
                    deferred.resolve(result);
                }

                db.close();
            });
        }
    });
    return deferred.promise;
}

function addSubscriber(subscriber) {

    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        var collection;

        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            collection = db.collection('subscribers');
            collection.insert(subscriber, function(err, result) {
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

function unsetSubscriberConfirmationKey(subscriberKey, confirmationKey) {
    var deferred = Q.defer();

    MongoClient.connect(configJson.mongoConnectionUrl, function (err, db) {
        var collection;

        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            collection = db.collection('subscribers');
            collection.update({ subscriberKey: subscriberKey, confirmationKey: confirmationKey },
                { $unset: { confirmationKey : '' } },
                function(err, result) {
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

function sendConfirmationEmail(email, subscriberKey, confirmationKey) {
    var confirmationLink =
        "http://localhost:9090/confirmSubscription?confirmationKey=" + confirmationKey + "&subscriberKey=" + subscriberKey;

    transporter.sendMail({
        from: 'mlu4ev@gmail.com',
        to: email,
        subject: 'Hacker News Subscriber App - subscription confirm',
        text: "To complete subscription, please click on the following link: " + confirmationLink
    });
}

