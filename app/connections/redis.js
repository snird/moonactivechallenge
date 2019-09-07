const Redis = require('ioredis');

let config;
if (process.env.NODE_ENV === 'test') {
  config = {
    db: 1
  };
} else {
  config = {
    db: 0
  };
}

const getRedisInstance = () => {
  if (global.redis_instance == null) {
    global.redis_instance = new Redis(config);
  }
  return global.redis_instance;
};

module.exports = getRedisInstance;

