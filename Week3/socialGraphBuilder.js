// TODO - save graph in MongoDB

var DirectedGraph = require('./graph'),
    request = require('request'),
    keyGenerator = require('generate-key'),
    _ = require('underscore'),
    async = require('async'),
    Q = require('q');

function SocialGraphBuilder(username, depth) {
    this.username = username;
    this.depth = depth;
    this.graph = new DirectedGraph();
    this.graphId = undefined;

    var that = this;
    (function() {
        var nodesQueue = [],
            currNode = {
                username: that.username,
                level: 0
            };

        async.doWhilst(function(next) {
            request({
                    url: 'https://api.github.com/users/' + currNode.username + '/following' +
                        '?client_id=90b62efc2352f949de06&client_secret=ed910d1a6860e4823803befadec2df8bc48a87e9',
                    headers: {
                        'User-Agent': 'who-follows-you'
                    }
                },
                function (error, response, body) {
                    console.log(currNode.level + ' ' + currNode.username);

                    JSON.parse(body).forEach(function (followedUser) {
                        that.graph.addEdge(currNode.username, followedUser.login);

                        nodesQueue.push({
                            username: followedUser.login,
                            level: currNode.level + 1
                        });
                    });

                    next();
                });

        }, function() {
            return ((currNode = nodesQueue.shift()) && currNode.level <= that.depth);
        }, function(err) {
            if(err) {
                console.log(err);
                return;
            } else {
                that.graphId =  keyGenerator.generateKey(30);
                // saveGraph - > Mongo
            }
        });

    })();

    this.following = function() {
        if(!this.graphId) {
            return "Still building the graph, please call later";
        }

        return this.graph.getNeighborsFor(this.username);
    };

    this.isFollowing = function(username) {
        if(!this.graphId) {
            return "Still building the graph, please call later";
        }

        return _.contains(this.graph.getNeighborsFor(this.username), username);
    };

    this.stepsTo = function(usernameToFind) {
        var currNode,
            nodesQueue = [{
                username: this.username,
                level: 0
            }];

        while(nodesQueue.length > 0) {
            currNode =  nodesQueue.shift();

            if(currNode.username === usernameToFind) {
                return currNode.level;
            } else {
                this.graph.getNeighborsFor(currNode.username).forEach(function(username) {
                    nodesQueue.push({
                        username: username,
                        level: currNode.level + 1
                    });
                });
            }
        }

        return -1;
    }

}

module.exports = SocialGraphBuilder;
