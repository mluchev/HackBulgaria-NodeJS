var Q = require('q'),
    bodyParser = require('body-parser'),
    express = require('express'),
    nodeMailer = require('nodemailer'),
    request = require('request'),
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

app.post('/newArticles', function(req, res) {
    getAllSubscribers().then(function(allSubscribers) {
        var confirmedSubscribers = _.filter(allSubscribers, function(sub){
            return !sub.confirmationKey;
        });

        console.log(confirmedSubscribers);

        sendEmails(confirmedSubscribers, req.body, transporter);
    });

    res.end();
});


function sendEmail(email, articles, keywordsFound, transporter) {
    var emailText = '',
        keywordsText = '';

    keywordsFound.forEach(function(keyword) {
        keywordsText += keyword + ' ';
    });

    articles.forEach(function(article) {
        if(article.type === 'story') {
            emailText += "STORY: " + article.title + '\n';
            emailText += article.text ? article.text + '\n' : '';
            emailText += article.url + '\n';
            emailText += '\n\n\n\n';
        } else if(article.type === 'comment') {
            emailText += "COMMENT: " + article.text + '\n';
            emailText += "ON STORY: " + article.storyUrl + '\n';
            emailText += '\n\n\n\n';
        }
    });

    console.log(emailText);

    transporter.sendMail({
        from: 'mlu4ev@gmail.com',
        to: email,
        subject: 'Hacker News Subscriber App - new articles with keywords: ' + keywordsFound,
        text: emailText
    });
}


function sendEmails(allSubscribers, newArticles, transporter) {
    allSubscribers.forEach(function(subscriber) {
        var articlesToSend = [],
            keywordsFound = [];


        subscriber.keywords.forEach(function(keyword) {
            newArticles.forEach(function(article) {
                if(_.contains(subscriber.type, article.type)){
                    if((article.type === 'comment' && (article.text.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)) ||
                        (article.type === 'story' && (article.title.toLowerCase().indexOf(keyword.toLowerCase()) !== -1))) {

                        articlesToSend.push(article);

                        if(!_.contains(keywordsFound, keyword)) {
                            keywordsFound.push(keyword);
                        }
                    }
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
