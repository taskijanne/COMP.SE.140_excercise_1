import { use, expect } from 'chai'
import chaiHttp from 'chai-http'
const chai = use(chaiHttp)
const server = 'http://localhost:8198'; // Replace with your server URL

const authHeader = Buffer.from("admin:admin").toString('base64');

describe('Basic tests', () => {
  it('should return 401 when not authorized', (done) => {
    chai.request.execute(server)
      .get('/api/')
      .end((err, res) => {
        expect(res).to.have.status(401);
        done();
      });
  });

  it('should return 200 when authorized', (done) => {
    chai.request.execute(server)
      .get('/api/')
      .set('Authorization', `Basic ${authHeader}`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});