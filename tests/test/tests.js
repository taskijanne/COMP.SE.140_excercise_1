import { use, expect } from 'chai'
import chaiHttp from 'chai-http'
const chai = use(chaiHttp)
const server = 'http://localhost:8197'; // Replace with your server URL

describe('Running tests ', async () => {
  it('/state should return INIT when tests are started', (done) => {
    chai.request.execute(server)
      .get('/state')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        expect(res.text).to.include('INIT');
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
  });

  it('/run-log should return 400 when state is INIT', (done) => {
    chai.request.execute(server)
      .get('/run-log')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  });

  it('should not allow changing state from INIT => PAUSED', (done) => {
    chai.request.execute(server)
      .put('/state')
      .set('Content-Type', 'text/plain')
      .send('PAUSED')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  });

  it ('should allow changing state from INIT => RUNNING', (done) => {
    chai.request.execute(server)
      .put('/state')
      .set('Content-Type', 'text/plain')
      .send('RUNNING')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        expect(res.text).to.include('RUNNING');
        done();
      });
  });

  it('/request should return 200 when state is RUNNING', (done) => {
    chai.request.execute(server)
      .get('/request')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  });

  it('/run-log should return 200 when state is RUNNING', (done) => {
    chai.request.execute(server)
      .get('/run-log')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  });

  it('should contain 2 lines of logs', (done) => {
    chai.request.execute(server)
      .get('/run-log')
      .end((err, res) => {
        expect(res.text.split('\n').length).to.equal(2);
        done();
      });
  });

  it('should allow changing state from RUNNING => PAUSED', (done) => {
    chai.request.execute(server)
      .put('/state')
      .set('Content-Type', 'text/plain')
      .send('PAUSED')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        expect(res.text).to.include('PAUSED');
        done();
      });
  });

  it('/request should return 400 when state is PAUSED', (done) => {
    chai.request.execute(server)
      .get('/request')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  });

  it('/run-log should return 400 when state is PAUSED', (done) => {
    chai.request.execute(server)
      .get('/run-log')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        done();
      });
  });

  it('should allow changing state from PAUSED => RUNNING', (done) => {
    chai.request.execute(server)
      .put('/state')
      .set('Content-Type', 'text/plain')
      .send('RUNNING')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        expect(res.text).to.include('RUNNING');
        done();
      });
  });

  it('should allow changing state from RUNNING => SHUTDOWN', (done) => {
    chai.request.execute(server)
      .put('/state')
      .set('Content-Type', 'text/plain')
      .send('SHUTDOWN')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
        expect(res.text).to.include('SHUTDOWN');
        done();
      });
  }); 

  /*
  it('should return error since containers are down', async function () {
    this.timeout(6000); // Increase the timeout to 6 seconds to prevent mochas timeout to kick in before http timeout
  
    // Wait for 3 seconds to allow shutdown
    await new Promise(resolve => setTimeout(resolve, 3000));
  
    try {
      const res = await chai.request.execute(server).get('/request');
      throw new Error(`Server is still alive: received status ${res.status}`);

    } catch (err) {
      expect(err.code).to.equal("ECONNREFUSED"); // Server is down
    }
  });*/

});