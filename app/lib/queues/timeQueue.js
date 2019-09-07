

const push = (queueName, redis) => {
  return async (task) => {
    await redis.zadd(queueName, task.time, `${task.time}::${task.message}`);
  };
};

const pop = (queueName, redis) => {
  return async (cb = ()=>{}) => {
    const top = await redis.zpopmin(queueName);
    if (top.length > 0) {
      const task = { message: top[0].split('::')[1], time: parseInt(top[1]) };
      await cb(task);
      return task;
    } else {
      return null;
    }
  };
};

const peek = (queueName, redis) => {
  return async () => {
    const top = await redis.zrange(queueName, 0, 1, 'WITHSCORES');
    if (top.length > 0) {
      const task = { message: top[0].split('::')[1], time: parseInt(top[1]) };
      return task;
    } else {
      return null;
    }
  };
};

// Todo: test
const remove = (queueName, redis) => {
  return async (task) => {
    await redis.zrem(queueName, `${task.time}::${task.message}`);
  };
};

module.exports = (queueName, redisClient) => {
  return {
    push: push(queueName, redisClient),
    pop: pop(queueName, redisClient),
    peek: peek(queueName, redisClient),
    remove: remove(queueName, redisClient)
  };
};

