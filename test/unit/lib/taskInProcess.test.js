const taskInProcess = require('../../../app/lib/taskInProcess');

const fakeQueue = () => {
  let queue = {};
  return {
    queue: queue,
    push: (task) => {
      return new Promise(resolve => {
        queue[task.time] = `${task.time}::${task.message}`;
        resolve();
      });
    },
    pop: () => {
      return new Promise(resolve => {
        const key = Object.keys(queue).sort()[0];
        let task = null;
        if (key && queue[key]) {
          task = { message: queue[key].split('::')[1], time: parseInt(key) };
          delete queue[key];
        }
        resolve(task);
      });
    },
    peek: () => {
      return new Promise(resolve => {
        const key = Object.keys(queue).sort()[0];
        let task = null;
        if (key && queue[key]) {
          task = { message: queue[key].split('::')[1], time: parseInt(key) };
        }
        resolve(task);
      });
    },
    remove: (task) => {
      return new Promise(resolve => {
        const key = Object.keys(queue).find(key => queue[key] === `${task.time}::${task.message}`);
        delete queue[key];
        resolve();
      });
    },
    reset: () => queue = {}
  };
};

const taskQueue = fakeQueue();
const handledTaskQueue = fakeQueue();

let log = [];
const logger = (msg) => {
  log.push(msg);
};

afterEach(() => {
  taskInProcess.resetState();
  taskQueue.reset();
  handledTaskQueue.reset();
  log = [];
  if (global.taskTimeOut) {
    clearTimeout(global.taskTimeOut);
  }
});

describe('taskInProcess', () => {
  describe('#getCurrentTask', () => {
    it('returns null when no task was set prior', () => {
      const task = taskInProcess.getCurrentTask();
      expect(task).toBe(null);
    });

    it('returns task when a task was set on system prior', async () => {
      const task = { message: 'hello', time: 152151 };
      await taskInProcess.setTask(task, logger, taskQueue, handledTaskQueue);
      const taskInState = taskInProcess.getCurrentTask();
      expect(taskInState).toStrictEqual(task);
    });
  });

  describe('#setTask', () => {
    it('will print a message at the said time', async () => {
      // Set up fakes
      const originalTimeout = setTimeout;
      const originalNow = Date.now;
      Date.now = () => new Date('2019-09-05T08:00:00Z').getTime();
      let execTime;
      const mockedTimeout = (fn, time) => {
        fn();
        execTime = time;
      };
      setTimeout = mockedTimeout;

      // Test
      const taskTime = new Date('2019-09-05T08:01:00Z').getTime();
      await taskInProcess.setTask({ message: 'Snir Test', time: taskTime }, logger, taskQueue, handledTaskQueue);
      expect(log).toEqual(['Snir Test']);
      expect(execTime).toEqual(60000);

      // Teardown
      setTimeout = originalTimeout;
      Date.name = originalNow;
    });

    it('push task to "handled_task_queue"', async () => {
      // Set up fakes
      const originalTimeout = setTimeout;
      const originalNow = Date.now;
      Date.now = () => new Date('2019-09-05T08:00:00Z').getTime();
      // Do not run the task itself for this test
      const mockedTimeout = () => {};
      setTimeout = mockedTimeout;

      // Test
      const taskTime = new Date('2019-09-05T09:01:00Z').getTime();
      const task = { message: 'Is it on queue?', time: taskTime };
      await taskInProcess.setTask(
        task,
        logger, taskQueue, handledTaskQueue
      );

      const lastTaskInQueue = await handledTaskQueue.peek();
      expect(lastTaskInQueue).toEqual(task);

      // Teardown
      setTimeout = originalTimeout;
      Date.name = originalNow;
    });

    it('push task to "handled_task_queue" and remove from there once executed', async () => {
      // Set up fakes
      const originalTimeout = setTimeout;
      const originalNow = Date.now;
      Date.now = () => new Date('2019-09-05T08:00:00Z').getTime();
      let executeTask;
      const mockedTimeout = (fn) => {
        executeTask = fn;
      };
      setTimeout = mockedTimeout;

      // Test
      const taskTime = new Date('2019-09-05T09:01:00Z').getTime();
      const task = { message: 'Is it on queue?', time: taskTime };
      await taskInProcess.setTask(
        task,
        logger, taskQueue, handledTaskQueue
      );

      const lastTaskInQueue = await handledTaskQueue.peek();
      expect(lastTaskInQueue).toEqual(task);
      executeTask();
      const lastTaskInQueueAfterExec = await handledTaskQueue.peek();
      expect(lastTaskInQueueAfterExec).toEqual(null);

      // Teardown
      setTimeout = originalTimeout;
      Date.name = originalNow;
    });
  });
});
