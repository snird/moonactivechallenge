const fromUnixTime = require('date-fns/fromUnixTime');
const isAfter = require('date-fns/isAfter');

const taskInProcess = require('../lib/taskInProcess');
const TaskQueue = require('../lib/queues/taskQueue');
const HandledTaskQueue = require('../lib/queues/handledTaskQueue');


exports.echoAtTime = async (ctx, next) => {
  const inputsValidated = validateInputs(ctx.request.body);
  if (!inputsValidated) {
    return responseError(ctx, next);
  }

  const taskQueue = TaskQueue(ctx.redis);
  const handledTaskQueue = HandledTaskQueue(ctx.redis);

  const incomingTask = { message: ctx.request.body.message, time: ctx.request.body.time };

  const currentTaskInProcess = taskInProcess.getCurrentTask();

  if (currentTaskInProcess == null || isAfter(currentTaskInProcess.time, incomingTask.time)) {
    await taskInProcess.setTask(incomingTask, ctx.logger, taskQueue, handledTaskQueue);
    if (currentTaskInProcess != null) {
      // If there was a task there before, we need to re-enqueue
      // it and remove it from handled tasks
      await taskQueue.push(currentTaskInProcess);
      await handledTaskQueue.remove(currentTaskInProcess);
    }
  } else {
    await taskQueue.push(incomingTask);
  }

  ctx.body = Object.assign(ctx.request.body, { status: 'Ok' });
};

const validateInputs = (inputs) => {
  let validated = true;
  validated &= typeof inputs.message === 'string';
  try {
    const time = fromUnixTime(inputs.time);
    const now = new Date();
    validated &= isAfter(time, now);
  } catch (err) {
    validated = false;
  }

  return validated;
};

const responseError = async (ctx, next) => {
  ctx.status = 422;
  ctx.body = { error: true };
  return await next;
};

