/**
 * We want task to be a global variable as it is a common
 * state for all requests coming into this process.
 * We can have better architecture to prevent any usage of globals,
 * but at this scale of code it is easier and more readable this way.
 */
global.task = typeof global.task === 'object' ? global.task : null;
global.taskTimeOut = typeof global.taskTimeOut === 'object' ? global.taskTimeOut : null;

const getCurrentTask = () => {
  // Send out a copy, not a reference to internal state
  return global.task == null ? null : Object.assign({}, global.task);
};

const setTask = async (task, logger, taskQueue, handledTaskQueue) => {
  global.task = Object.assign({}, task);
  // Clear our old task in process to be replaced
  if (typeof global.taskTimeOut === 'object') {
    clearTimeout(global.taskTimeOut);
  }

  const timeoutForTask = getTimeoutMsFromNow(task.time);

  global.taskTimeOut = setTimeout(
    taskExecutionCb(task, logger, taskQueue, handledTaskQueue),
    timeoutForTask
  );
  await handledTaskQueue.push(task);
};

const taskExecutionCb = (task, logger, taskQueue, handledTaskQueue) => {
  return async () => {
    logger(task.message);
    global.task = null;
    await handledTaskQueue.remove(task);

    // Push on the next task
    const nextTask = await taskQueue.pop();
    if (nextTask) {
      // Set the task in the event loop
      setTask(nextTask, logger, taskQueue, handledTaskQueue);
    }
  };
};

const getTimeoutMsFromNow = (time) => {
  const now = Date.now();
  const timeFromNow = time - now;
  if (timeFromNow < 0) {
    return 0;
  } else {
    return timeFromNow;
  }
};

const resetState = () => {
  global.task = null;
  clearTimeout(global.taskTimeOut);
  global.taskTimeOut = null;
};


module.exports = {
  getCurrentTask,
  setTask,
  resetState
};

