(function() {
    var bodyParser = require('body-parser'),
        express = require('express'),
        _ = require('underscore'),
        app = express(),
        Q = require('q'),
        SocialGraphBuilder = require('./socialGraphBuilder'),
        persistence = require('./persistence');

    app.use(bodyParser.json());

    app.post('/createGraphFor', function(req, res) {
        persistence.getGraphByUserAndDepth(req.body.username, req.body.depth).then(function(result) {
            var socialGraph;

            if(result){
                res.json({'graphId': result.graphId});
            } else {
                socialGraph = new SocialGraphBuilder(req.body.username, req.body.depth);
                socialGraph.buildGraph();

                res.json({'graphId': socialGraph.graphId});
            }
        });
    });



    app.get('/graph', function(req, res) {
        persistence.getGraphById(req.query.graphId).then(function(graph) {
            if(graph) {
                res.json(graph);
            } else {
                res.end('Graph not yet created.');
            }
        });
    });

    app.get('/mutually_follow', function(req, res) {
        var username = req.query.username;

        persistence.getGraphById(req.query.graphId).then(function(socialGraph) {
            var first = false,
                second = false,
                result;

            if(socialGraph) {
                if(_.contains(socialGraph.graph.neighborsList[socialGraph.username], username)) {
                    first = true;
                }
                if(_.contains(socialGraph.graph.neighborsList[username], socialGraph.username)) {
                    second = true;
                }

                if(first && second) {
                    result = {
                        "relation": "mutual"
                    };
                } else if(first) {
                    result = {
                        "relation": "first"
                    };
                } else if(second) {
                    result = {
                        "relation": "second"
                    };
                } else {
                    result = {
                        "relation": "none"
                    };
                }

                res.json(result);
            } else {
                res.end('Such graph not yet created.');
            }
        });

    });

    app.listen(5000);
})();