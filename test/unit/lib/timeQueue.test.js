const redisClient = require('../../../app/connections/redis')();
const timeQueue = require('../../../app/lib/queues/timeQueue')('queueName', redisClient);

afterEach(async () => {
  await redisClient.flushdb();
});

describe('timeQueue', () => {
  describe('#push', () => {
    it('adds a task to a queue', async () => {
      const payload = { message: 'hello', time: 1000 };
      await timeQueue.push(payload);

      const top = await timeQueue.pop();
      expect(top).toEqual(payload);
    });
  });

  describe('#pop', () => {
    it('pops the last message by time in the queue', async () => {
      const payload1 = { message: 'hello1000', time: 1000 };
      const payload2 = { message: 'hello2000', time: 2000 };
      const payload3 = { message: 'hello3000', time: 3000 };

      // Push payload2 first, to make sure the order of push is
      // not affecting it.
      await timeQueue.push(payload2);
      await timeQueue.push(payload1);
      await timeQueue.push(payload3);

      const top = await timeQueue.pop();
      expect(top).toEqual(payload1);
    });

    it('removes the message it pops from queue', async () => {
      const payload = { message: 'hello', time: 1000 };

      await timeQueue.push(payload);

      // Firt pop to get the only message out
      await timeQueue.pop();
      // Second pop should be null then
      const top = await timeQueue.pop();
      expect(top).toEqual(null);
    });

    it('returns null if no more messages in the queue', async () => {
      const top = await timeQueue.pop();
      expect(top).toEqual(null);
    });

    it('accepts a cb parameter and executes it', async () => {
      expect.assertions(1);
      const payload = { message: 'hello', time: 1000 };

      await timeQueue.push(payload);
      const cb = (task) => {
        expect(task.message).toEqual('hello');
      };

      await timeQueue.pop(cb);
    });
  });

  describe('#peek', () => {
    it('returns the last message by time in the queue', async () => {
      const payload1 = { message: 'hello1000', time: 1000 };
      const payload2 = { message: 'hello2000', time: 2000 };
      const payload3 = { message: 'hello3000', time: 3000 };

      // Push payload2 first, to make sure the order of push is
      // not affecting it.
      await timeQueue.push(payload2);
      await timeQueue.push(payload1);
      await timeQueue.push(payload3);

      const top = await timeQueue.peek();
      expect(top).toEqual(payload1);
    });
  });
});
