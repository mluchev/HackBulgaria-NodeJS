var storage = require('node-persist'),
    bodyParser = require('body-parser'),
    express = require('express'),
    keyGenerator = require('generate-key'),
    nodeMailer = require('nodemailer'),
    _ = require('underscore'),
    app = express(),
    transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'mluchev@gmail.com',
            pass: '0000'
        }
    });

app.use(bodyParser.json());

storage.initSync({
    dir: 'subscribers'
});

app.post('/subscribe', function(req, res) {
    var newSubscriber = req.body,
        subscribers = storage.getItem('subscribers.json') || {},
        newSubsKey = keyGenerator.generateKey(30),
        confirmationKey = keyGenerator.generateKey(30);


    // insert
    newSubscriber.confirmationKey = confirmationKey;
    subscribers[newSubsKey] = newSubscriber;

    sendConfirmationEmail(newSubscriber.email, newSubsKey, confirmationKey);

    storage.setItem('subscribers.json', subscribers);
    res.json({'key': newSubsKey});
});
app.post('/unsubscribe', function(req, res) {
    var subscriberIdToDelete = req.body.subscriberId,
        subscribers = storage.getItem('subscribers.json') || {};

    if(subscribers[subscriberIdToDelete]) {
        // remove({name: 'a'})
        delete subscribers[subscriberIdToDelete];
        storage.setItem('subscribers.json', subscribers);

        res.end('Subscriber deleted.');
    } else {
        res.end('Subscriber not found.');
    }
});

app.get('/listSubscribers', function(req, res) {
    var subscribers = storage.getItem('subscribers.json') || {},
        resList = [];

    Object.keys(subscribers).forEach(function(subscriberId) {
        var sub = {
            email: subscribers[subscriberId].email,
            keywords: subscribers[subscriberId].keywords,
            type: subscribers[subscriberId].type,
            subscriberId: subscriberId
        };

        if(subscribers[subscriberId].confirmationKey) {
            sub.confirmationKey = subscribers[subscriberId].confirmationKey;
        }

        resList.push(sub);
    });

    res.json(resList);

});

app.get('/confirmSubscription', function(req, res) {
    var subscribers = storage.getItem('subscribers.json') || {};

    if(subscribers[req.query.subscriberKey]
        && (subscribers[req.query.subscriberKey].confirmationKey === req.query.confirmationKey)) {
        delete subscribers[req.query.subscriberKey].confirmationKey;

        storage.setItem('subscribers.json', subscribers);
        res.end('Subscription confirmed.');
    } else {
        res.end('Subscription failed.');
    }
});

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

app.listen(9090);
