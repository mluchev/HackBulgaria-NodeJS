var Q = require('q'),
    bodyParser = require('body-parser'),
    express = require('express'),
    nodeMailer = require('nodemailer'),
    request = require('request'),
    app = express(),
    transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'mluchev@gmail.com',
            pass: '1111111111111'
        }
    });

app.use(bodyParser.json());

app.post('/newArticles', function(req, res) {
    getAllSubscribers().then(function(allSubscribers) {
        sendEmails(allSubscribers, req.body, transporter);
    });

    res.end();
});


function sendEmail(email, articles, keywordsFound, transporter) {
    var emailText = '',
        keywordsText = '';

    keywordsFound.forEach(function(keyword) {
        keywordsText += keyword + ' '
    });

    articles.forEach(function(article) {
        emailText += article.title + '\n';
        emailText += article.url + '\n';
        emailText += '\n\n\n\n';
    })

    console.log(emailText);

    transporter.sendMail({
        from: 'mlu4ev@gmail.com',
        to: email,
        subject: 'Hacker News subscription - new articles with keywords: ' + keywordsFound,
        text: emailText
    });
}


function sendEmails(allSubscribers, newArticles, transporter) {
    allSubscribers.forEach(function(subscriber) {
        var articlesToSend = [],
            keywordsFound = [];

        subscriber.keywords.forEach(function(keyword) {
            newArticles.forEach(function(article) {
                if(article.title.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                    articlesToSend.push(article);

                    // should be checked with _.contains
                    keywordsFound.push(keyword);
                }
            });
        });

        if(articlesToSend.length) {
            sendEmail(subscriber.email, articlesToSend, keywordsFound, transporter);
        }
    });
}

function getAllSubscribers() {
    var deferred = Q.defer();

    request.get({
        'url': 'http://localhost:9090/listSubscribers',
        'json' : true
    },function(error, response, body) {
        if(error) {
            deferred.reject();
            console.log(error);
        } else {
            deferred.resolve(body);
        }
    });

    return deferred.promise;
}

app.listen(5555);
