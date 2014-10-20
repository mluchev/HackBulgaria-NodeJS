var storage = require('node-persist'),
    bodyParser = require('body-parser'),
    express = require('express'),
    keyGenerator = require('generate-key'),
    app = express();

app.use(bodyParser.json());

storage.initSync({
    dir: 'subscribers'
});

app.post('/subscribe', function(req, res) {
    var newSubscriber = req.body,
        subscribers = storage.getItem('subscribers.json') || {},
        newSubsKey = keyGenerator.generateKey(100);

    subscribers[newSubsKey] = newSubscriber;

    storage.setItem('subscribers.json', subscribers);
    res.json({'key': newSubsKey});
});

app.post('/unsubscribe', function(req, res) {
    var subscriberIdToDelete = req.body.subscriberId,
        subscribers = storage.getItem('subscribers.json') || {};

    if(subscribers[subscriberIdToDelete]) {
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
        resList.push({
            email: subscribers[subscriberId].email,
            keywords: subscribers[subscriberId].keywords,
            subscriberId: subscriberId
        });
    });

    res.json(resList);

});

app.listen(9090);
