var expect = require('chai').expect
    DirectedGraph = require('./../graph');

describe('Graph', function(){
    var testingGraph;

    beforeEach(function(){
        testingGraph = new DirectedGraph();
        testingGraph.addEdge('marto', 'ivan');
        testingGraph.addEdge('marto', 'georgi');
        testingGraph.addEdge('ivan', 'stefan');
        testingGraph.addEdge('ivan', 'maria');
        testingGraph.addEdge('georgi', 'rado');
        testingGraph.addEdge('maria', 'marto');
        testingGraph.addEdge('rado', 'pesho');
    });

    describe('#toString()', function(){
        it('should return correct stringified version of the graph', function(){
            var expectedResult = {
                marto: [ "ivan", "georgi" ],
                ivan: [ "stefan", "maria" ],
                georgi: [ "rado" ],
                stefan: [],
                maria: [ "marto" ],
                rado: [ "pesho" ],
                pesho: []
            };

            expect(testingGraph.toString()).to.equal(JSON.stringify(expectedResult, null, 4));
        })
    });

    describe('#addEdge(nodeA, nodeB)', function(){
        it('should add edge properly to the neighbors list',
            function(){
                var expectedResult = {
                    marto: [ "ivan", "georgi", "dobri" ],
                    ivan: [ "stefan", "maria" ],
                    georgi: [ "rado" ],
                    stefan: [],
                    maria: [ "marto" ],
                    rado: [ "pesho" ],
                    pesho: [],
                    dobri: []
                };

                testingGraph.addEdge('marto', 'dobri');

                expect(testingGraph.neighborsList).to.deep.equal(expectedResult);
            });
        it('should not add edge that already exists',
            function(){
                testingGraph.addEdge('marto', 'ivan');

                expect(testingGraph.neighborsList).to.deep.equal(testingGraph.neighborsList);
            })
    });

    describe('#getNeighborsFor(node)', function(){
        it('should retrieve every neighbor of the node and only it',
            function(){
                expect(testingGraph.neighborsList['marto']).to.deep.equal([ "ivan", "georgi"]);
            })
    });

    describe('#pathBetween(nodeA, nodeB)', function(){
        it('should return true if path exists',
            function(){
                expect(testingGraph.pathBetween("marto", "pesho")).to.equal(true);
            });
        it('should return false if path does not exist',
            function(){
                expect(testingGraph.pathBetween("marto", "stanoi")).to.equal(false);

            });
    });
});



//describe('Array', function(){
//    describe('#indexOf()', function(){
//        it('should return -1 when the value is not present', function(){
//            expect(foo).to.be.a('string');
//            expect(foo).to.equal('bar');
//            expect(foo).to.have.length(3);
//            expect(beverages).to.have.property('tea').with.length(3);
//        })
//    })
//});
