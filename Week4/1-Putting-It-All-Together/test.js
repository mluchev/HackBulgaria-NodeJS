var expect = require('chai').expect,
    request = require('supertest'),
    app = require('./app');

describe('Snippet', function(){
    var testSnippetId;

    describe('POST /createSnippet', function(){
        it('should return snippetId', function(done){
            request(app)
                .post("/createSnippet")
                .send({
                    "filename": "aaa.js",
                    "content": "var a = 0;",
                    "creator": "mluchev",
                    "type": "js"
                })
                .expect(200)
                .end(function(err, res) {
                    testSnippetId = res.body.snippetId;

                    expect(res.body).to.have.property("snippetId");
                    expect(res.body.snippetId.length).to.equal(30);
                    done();
                });
        })
    });

    describe('GET /allSnippets', function(){
        it('should return a nonempty array of snippets', function(done){
            request(app)
                .get('/allSnippets')
                .expect(200)
                .end(function(err, res){
                    if (err) {
                        throw err;
                    } else {
                        expect(res.body).to.have.length.above(0);
                        done();
                    }
                });
        })
    });

    describe('POST /updateSnippet', function(){
        it('should return {"numOfUpdatedDocs": 1}', function(done){
            request(app)
                .post("/updateSnippet")
                .send({
                    "snippetId": testSnippetId,

                    "snippet":{
                        "filename": "ccc.js",
                        "content": "var c = 0;",
                        "creator": "cmuchev",
                        "type": "js"
                    }
                })
                .expect(200)
                .end(function(err, res) {
                    expect(res.body).to.have.property("numOfUpdatedDocs");
                    expect(res.body.numOfUpdatedDocs).to.equal(1);
                    done();
                });
        })
    });

    describe('GET /snippet', function(){
        it('should return the updated snippet', function(done){
            request(app)
                .get('/snippet?snippetId=' + testSnippetId)
                .expect(200)
                .end(function(err, res){
                    if (err) {
                        throw err;
                    } else {
                        expect(res.body).to.have.property("filename");
                        expect(res.body).to.have.property("content");
                        expect(res.body).to.have.property("creator");
                        expect(res.body).to.have.property("type");
                        expect(res.body.filename).to.equal("ccc.js");
                        expect(res.body.creator).to.equal("cmuchev");
                        done();
                    }
                });
        })
    });


    describe('GET /snippetsOfCreator', function(){
        it('should return a nonempty array of snippets', function(done){
            request(app)
                .get('/snippetsOfCreator?creator=cmuchev')
                .expect(200)
                .end(function(err, res){
                    if (err) {
                        throw err;
                    } else {
                        expect(res.body).to.have.length.above(0);
                        done();
                    }
                });
        })
    });

    describe('DELETE /deleteSnippet', function(){
        it('should return {"numOfDeletedDocs": 1}', function(done){
            request(app)
                .delete("/deleteSnippet")
                .send({
                    "snippetId": testSnippetId
                })
                .expect(200)
                .end(function(err, res) {
                    console.log(res.body);
                    expect(res.body).to.have.property("numOfDeletedDocs");
                    expect(res.body.numOfDeletedDocs).to.equal(1);
                    done();
                });
        })
    });
});