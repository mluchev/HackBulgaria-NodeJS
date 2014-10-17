// put everything into functions
// implement
// GET /chirps - expects either chirpId or userId as an argument. If given both ignores chirpId. Returns a list of chirps.
var http = require("http"),
    ArgumentParser = require('argparse').ArgumentParser,
    fs = require('fs'),
    url = require('url'),
    config = JSON.parse(fs.readFileSync('./config.json')),
    parser = new ArgumentParser({}),
    args = addParserArgs(parser);

if(args.getall) {
    performGetRequest(config.api_url + "/all_chirps");
} else if(args.create) {
    createChirp(args.message, config);
} else if(args.getusers) {
    performGetRequest(config.api_url + "/all_users");
} else if(args.getself) {
    performGetRequest(config.api_url + "/my_chirps?key=" + config.key + "&user=" + config.user);
} else if(args.register) {
    registerUser(args.user, config);
} else if(args.delete) {
    deleteChirp(args.chirpId, config);
}

function addParserArgs(parser) {
    parser.addArgument(['--getall'], {action: 'storeTrue'});
    parser.addArgument(['--create'], {action: 'storeTrue'});
    parser.addArgument(['--message']);
    parser.addArgument(['--getusers'], {action: 'storeTrue'});
    parser.addArgument(['--getself'], {action: 'storeTrue'});
    parser.addArgument(['--register'], {action: 'storeTrue'});
    parser.addArgument(['--user']);
    parser.addArgument(['--delete'], {action: 'storeTrue'});
    parser.addArgument(['--chirpId']);

    return parser.parseArgs();
}

function createChirp(chirpText,  config) {
    function resCallback(recData) {
        console.log(JSON.parse(recData));
    };

    performPostOrDelRequest('/chirp', 'POST', {
        user: config.user,
        key: config.key,
        chirpText: chirpText
    }, resCallback);
}



function registerUser(user, config) {
    function resCallback(recData) {
        if(recData) {
            config.user = user;
            config.key = JSON.parse(recData).key;

            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));

            console.log(JSON.parse(recData));
        }
    }

    performPostOrDelRequest('/register', 'POST', {user: user}, resCallback);
}

function deleteChirp(chirpId, config) {
    function resCallback(recData) {
        if(recData) {
            console.log(JSON.parse(recData));
        }
    }

    performPostOrDelRequest('/chirp', 'DELETE',{
        user: config.user,
        key: config.key,
        chirpId: chirpId
    }, resCallback);
}

function performPostOrDelRequest(path, reqType, postBody, resCallback) {
    var receivedData = '',
        req = http.request({
            hostname: url.parse(config.api_url).hostname,
            path: path,
            port: 8080,
            method: reqType,
            headers: {
                'Content-Type': 'application/json'
            }
        }, function(res) {
            res.on("data", function(data) {
                receivedData += data
            });
            res.on('end', function() {
                resCallback(receivedData);
            });
        });

    req.write(JSON.stringify(postBody));

    req.end();

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
}
function performGetRequest(reqUrl) {
    var receivedData = '';

    http.get(reqUrl, function(res) {
        res.on("data", function(data) {
            receivedData += data
        });

        res.on('end', function() {
            console.log(JSON.parse(receivedData));
        });
    });
}