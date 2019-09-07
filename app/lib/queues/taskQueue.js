const timeQueue = require('./timeQueue');

module.exports = (redisClient) => {
  return timeQueue('tasks', redisClient);
};

