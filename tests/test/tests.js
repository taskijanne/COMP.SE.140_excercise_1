import { use, expect } from 'chai'
import chaiHttp from 'chai-http'
const chai = use(chaiHttp)
const server = 'http://localhost:8197'; // Replace with your server URL

// const authHeader = Buffer.from("admin:admin").toString('base64');

describe('Running tests ', () => {
  it('/state should return INIT when tests are started', (done) => {
    chai.request.execute(server)
      .get('/state')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        expect(res.text).to.equal('INIT');
        done();
      });
  });

  it('/request should return 400 when state is INIT', (done) => {
    chai.request.execute(server)
      .get('/request')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  }


});