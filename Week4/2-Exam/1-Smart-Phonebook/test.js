var expect = require('chai').expect,
    request = require('supertest'),
    app = require('./app');

describe('Endpoints', function(){
    describe('POST /createContact', function(){
        it('should return contact', function(done){
            request(app)
                .post("/createContact")
                .send({
                    phoneNumber: '0939393934',
                    personIdentifier: 'mluchev'
                })
                .expect(200)
                .end(function(err, res) {
                    console.log(res.body);
                    expect(res.body).to.have.property("phoneNumber");
                    expect(res.body).to.have.property("personIdentifier");
                    expect(res.body).to.have.property("_id");
                    expect(res.body.personIdentifier).to.equal("mluchev");
                    expect(res.body.phoneNumber).to.equal("0939393934");
                    done();
                });
        })
    });

    describe('GET /allContacts', function(){
        it('should return a nonempty array of contacts', function(done){
            request(app)
                .get('/allContacts')
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

    describe('GET /contact', function(){
        it('should return the created contact', function(done){
            request(app)
                .get('/contact?personIdentifier=mluchev')
                .expect(200)
                .end(function(err, res){
                    if (err) {
                        throw err;
                    } else {
                        expect(res.body).to.have.property("personIdentifier");
                        expect(res.body).to.have.property("phoneNumber");
                        expect(res.body.personIdentifier).to.equal("mluchev");
                        expect(res.body.phoneNumber).to.equal("0939393934");
                        done();
                    }
                });
        })
    });

    describe('DELETE /deleteContact', function(){
        it('should return {"numOfDeletedDocs": 1}', function(done){
            request(app)
                .delete("/deleteContact")
                .send({
                    "personIdentifier": 'mluchev'
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