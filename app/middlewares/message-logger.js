'use strict';

/**
 * Return middleware that adds message logger to context
 *
 * @return {function} Koa middleware.
 */
module.exports = (logger) => {
  return async (ctx, next) => {
    if (logger) {
      ctx.logger = logger;
    } else {
      ctx.logger = (msg) => {
        console.log('TASKED MESSAGE OUTPUT: ' + msg);
      };
    }
    await next();
  };
};
