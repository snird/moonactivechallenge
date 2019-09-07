'use strict';

const redis = require('../connections/redis');

/**
 * Return middleware that adds redis client into context
 *
 * @return {function} Koa middleware.
 */
module.exports = () => {
  return async function redisClient(ctx, next) {
    ctx.redis = redis();
    await next();
  };
};
