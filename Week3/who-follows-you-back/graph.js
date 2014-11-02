function DirectedGraph() {
    var _ = require('underscore');

    this.neighborsList =  {};

    this.addEdge = function(nodeA, nodeB) {
        if(!this.neighborsList[nodeA]) {
            this.neighborsList[nodeA] = [];
        }

        if(!this.neighborsList[nodeB]) {
            this.neighborsList[nodeB] = [];
        }

        if(!_.contains(this.neighborsList[nodeA], nodeB)) {
            this.neighborsList[nodeA].push(nodeB);
        }
    };

    this.getNeighborsFor = function(node) {
        return this.neighborsList[node];
    };

    this.pathBetween = function(nodeA, nodeB) {
        var nodesToTraverse = [],
            traversedNodes = [],
            currNode;

        nodesToTraverse.push(nodeA);

        while(nodesToTraverse.length > 0) {
            currNode =  nodesToTraverse.shift();
            traversedNodes.push(currNode);

            if(currNode === nodeB) {
                return true;
            } else {
                if(_.difference(Object.keys(this.neighborsList), traversedNodes).length > 0) {
                    _.forEach(this.neighborsList[currNode], function (node) {
                        nodesToTraverse.push(node);
                    });

                } else {
                    return false
                }
            }
        }

        return false;
    };

    this.toString = function() {
        return JSON.stringify(this.neighborsList, null, 4);
    };

}

module.exports = DirectedGraph;
