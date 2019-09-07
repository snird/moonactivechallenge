'use strict';

const supertest = require('supertest');
const appInit = require('../../app');
const { resetState } = require('../../app/lib/taskInProcess');

let log = [];
const messageLogger = (message) => {
  log.push(message);
};

const app = appInit(messageLogger);
const server = app.listen();

afterAll(async () => {
  await app.terminate();
});

afterEach(() => {
  resetState();
  log = [];
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('echoAtTime', () => {
  const request = supertest(server);

  describe('POST /echoAtTime', () => {
    it('Should respond with 200 ok if message and time passed correctly', async () => {
      const messageTime = 1640995200;
      const res = await request
        .post('/echoAtTime')
        .send({ message: 'Hello', time: messageTime })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const response = res.body;
      expect(response.message).toBe('Hello');
      expect(response.time).toBe(messageTime);
      expect(response.status).toBe('Ok');
    });

    describe('Respond 422 error if message structure is wrong', () => {
      it('when no message', async () => {
        const messageTime = 1640995200;
        const res = await request
          .post('/echoAtTime')
          .send({ time: messageTime })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(422);

        const response = res.body;
        expect(response.error).toBe(true);
      });

      it('when no time', async () => {
        const res = await request
          .post('/echoAtTime')
          .send({ message: 'hello' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(422);

        const response = res.body;
        expect(response.error).toBe(true);
      });

      it('when message is not a string', async () => {
        const messageTime = '32532632472347324';
        const res = await request
          .post('/echoAtTime')
          .send({ message: 11, time: messageTime })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(422);

        const response = res.body;
        expect(response.error).toBe(true);
      });

      it('when cant convert time to timestamp', async () => {
        const messageTime = 'wat';
        const res = await request
          .post('/echoAtTime')
          .send({ message: 'Hello', time: messageTime })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(422);

        const response = res.body;
        expect(response.error).toBe(true);
      });
    });

    describe('Should log out scheduled messages', () => {
      const sendTask = async (task) => {
        const res = await request
          .post('/echoAtTime')
          .send(task)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200);
        return res;
      };

      it('Logs out a single message sent', async () => {
        const now = Date.now();
        // 0.5 second from now in Unix time
        const messageTime = now + 500;
        const task = { message: 'Hello', time: messageTime };
        sendTask(task);

        await sleep(1000);
        expect(log).toEqual(['Hello']);
      });

      it('Logs out multiple messages one after the other', async () => {
        const now = Date.now();
        // 0.5 second from now in Unix time
        const messageTime = now + 500;
        const task1 = { message: 'Hello1', time: messageTime };
        const task2 = { message: 'Hello2', time: messageTime + 200 };
        const task3 = { message: 'Hello3', time: messageTime + 400 };
        await sendTask(task1);
        await sendTask(task2);
        await sendTask(task3);

        await sleep(1000);
        expect(log).toEqual(['Hello1', 'Hello2', 'Hello3']);
      });

      it('Logs out multiple messages one after the other with break between', async () => {
        const now = Date.now();
        // 0.5 second from now in Unix time
        const messageTime = now + 500;
        const task1 = { message: 'Hello1', time: messageTime };
        const task2 = { message: 'Hello2', time: messageTime + 200 };
        const task3 = { message: 'Hello3', time: messageTime + 400 };
        await sendTask(task1);
        await sendTask(task2);

        await sleep(1000);
        await sleep(200);
        expect(log).toContain('Hello1');
        expect(log).toContain('Hello2');
        await sendTask(task3);
        await sleep(1000);
        expect(log).toContain('Hello3');
      });

      it('Logs out multiple messages one after the other when sent latest first.', async () => {
        const now = Date.now();
        // 0.5 second from now in Unix time
        const messageTime = now + 500;
        const task1 = { message: 'Hello1', time: messageTime };
        const task2 = { message: 'Hello2', time: messageTime + 400 };
        await sendTask(task2);
        await sendTask(task1);

        await sleep(1000);
        expect(log).toEqual(['Hello1', 'Hello2']);
      });
    });
  });
});
