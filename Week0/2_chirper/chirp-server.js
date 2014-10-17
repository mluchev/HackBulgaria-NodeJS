var http = require('http'),
    qs = require('querystring'),
    uuid = require('node-uuid'),
    url = require('url'),
    _ = require('underscore'),
    allChirps = [],
    allUsers = [];

http.createServer(function (req, res) {
    if(req.url.indexOf("/all_chirps") === 0) {
        processGetAllChirpsReq(res, allChirps);
    } else if(req.url.indexOf("/all_users") === 0) {
        sendResponse(res, 200, 'OK', allUsers);
    } else if(req.url.indexOf("/my_chirps") === 0) {
        processGetMyChirpsReq(req, res, allChirps);
    } else if(req.url.indexOf("/register") === 0) {
        processRegisterUserReq(req, res, allUsers)
    } else if(req.url.indexOf("/chirp") === 0) {
        if(req.method === 'POST') {
            processCreateNewChirpReq(req, res, allChirps, allUsers);
        } else if(req.method === 'DELETE') {
            processDeleteChirpReq(req, res, allChirps, allUsers);
        }
    }
}).listen(8080);

function processRegisterUserReq(req, res, allUsers) {
    var reqArgs = '',
        newUuid,
        currUser;

    req.on('data', function(data) {
        reqArgs += data;
    });

    req.on('end', function() {
        newUuid = uuid.v4();
        reqArgs = JSON.parse(reqArgs.toString());

        currUser = _.find(allUsers, function(user) {
            return user.user === reqArgs.user;
        });
        if(currUser) {
            sendResponse(res, 409, 'User already exists.');
        } else {
            allUsers.push({
                user: reqArgs.user,
                userId: newUuid,
                chirps: 0
            });
            sendResponse(res, 200, 'OK', {
                user: reqArgs.user,
                key: newUuid
            });
        }
    });
}

function processGetMyChirpsReq(req, res, allChirps) {
    var reqArgs = qs.parse(url.parse(req.url).query.toString()),
        myChirps = _.filter(allChirps, function(chirp){
            return chirp.userId === reqArgs.key;
        });

    sendResponse(res, 200, 'OK', myChirps);
}

function processDeleteChirpReq(req, res, allChirps, allUsers) {
    var indexToDel,
        chirpToDel,
        reqArgs = '',
        currUser;

    req.on('data', function(data) {
        reqArgs += data;
    });

    req.on('end', function() {
        reqArgs = JSON.parse(reqArgs.toString());

        _.forEach(allChirps, function(chirp, index){
            if(chirp.chirpId === reqArgs.chirpId) {
                indexToDel = index;
                chirpToDel = chirp;
            }
        });
        if(indexToDel) {
            if(allChirps[indexToDel].userId === reqArgs.key) {
                allChirps.splice(indexToDel, 1);

                // decrement num of chirps of the user
                currUser = _.find(allUsers, function(user) {
                    return user.userId === reqArgs.key;
                });
                if(currUser) {
                    currUser.chirps--;
                }
                sendResponse(res, 200, 'OK', chirpToDel);
            } else {
                sendResponse(res, 403, 'This operation is forbidden for this user.');
            }
        } else {
            sendResponse(res, 404, 'Item not found.');
        }

    });

}

function processCreateNewChirpReq(req, res, allChirps, allUsers) {
    var reqArgs = '',
        newUuid,
        currUser;

    req.on('data', function(data) {
        reqArgs += data;
    });

    req.on('end', function() {
        newUuid = uuid.v4();
        reqArgs = JSON.parse(reqArgs.toString());

        allChirps.push({
            userId: reqArgs.key,
            chirpId: newUuid,
            chirpText: reqArgs.chirpText,
            chirpTime: (new Date()).toLocaleString()
        });

        // increment num of chirps of the user
        currUser = _.find(allUsers, function(user) {
            return user.userId === reqArgs.key
        });
        if(currUser) {
            currUser.chirps++;
        }

        sendResponse(res, 200, 'OK', {'chirpId': newUuid});
    });
}

function processGetAllChirpsReq(res, allChirps) {
    var chirpsSortedByTime = _.sortBy(allChirps, function(chirp) {
        return chirp.chirpTime;
    });

    sendResponse(res, 200, 'OK', chirpsSortedByTime);
}

function sendResponse(res, statusCode,statusText, data) {
    res.writeHead(statusCode, statusText, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(data));
}