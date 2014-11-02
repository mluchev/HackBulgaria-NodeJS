function SocialGraphBuilder(username, depth) {
    var DirectedGraph = require('./graph'),
        request = require('request'),
        keyGenerator = require('generate-key'),
        _ = require('underscore'),
        async = require('async'),
        persistence = require('./persistence'),
        Q = require('q'),
        that = this;

    this.username = username;
    this.depth = depth;
    this.graph = new DirectedGraph();
    this.isGraphFullyBuilt = undefined;
    this.graphId = keyGenerator.generateKey(30);

    this.following = function () {
        if (this.isGraphFullyBuilt) {
            return this.graph.getNeighborsFor(this.username);
        }
        return "Still building the graph, please call later";

    };

    this.isFollowing = function (username) {
        if (this.isGraphFullyBuilt) {
            return _.contains(this.graph.getNeighborsFor(this.username), username);
        }
        return "Still building the graph, please call later";
    };

    this.stepsTo = function (usernameToFind) {
        var currNode,
            nodesQueue;

        if (!this.isGraphFullyBuilt) {
            return "Still building the graph, please call later";
        }

        nodesQueue = [
                {
                    username: this.username,
                    level: 0
                }
            ];

        while (nodesQueue.length > 0) {
            currNode = nodesQueue.shift();

            if (currNode.username === usernameToFind) {
                return currNode.level;
            } else {
                this.graph.getNeighborsFor(currNode.username).forEach(function (username) {
                    nodesQueue.push({
                        username: username,
                        level: currNode.level + 1
                    });
                });
            }
        }

        return -1;
    };


    this.buildGraph = function() {
        persistence.getGraphByUserAndDepth(that.username, that.depth).then(function(result) {
            if(result) {
                return;
            }

            var nodesQueue = [],
                currNode = {
                    username: that.username,
                    level: 0
                };

            async.doWhilst(function (next) {
                request({
                        url: 'https://api.github.com/users/' + currNode.username + '/following' +
                            '?client_id=90b62efc2352f949de06&client_secret=ed910d1a6860e4823803befadec2df8bc48a87e9',
                        headers: {
                            'User-Agent': 'who-follows-you-back'
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

            }, function () {
                return ((currNode = nodesQueue.shift()) && currNode.level < that.depth);
            }, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    persistence.saveGraph(that).then(function() {
                        that.isGraphFullyBuilt = true;
                    });
                }
            });
        });
    }
}

module.exports = SocialGraphBuilder;
