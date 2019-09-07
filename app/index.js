#!/usr/bin/env node

'use strict';

const config = require('./config');
const App = require('./app');
const logger = require('./logger');

const redis = require('./connections/redis')();
const taskInProcess = require('./lib/taskInProcess');
const taskQueue = require('./lib/queues/taskQueue')(redis);

const initApp = (messageLogger) => {
  const app = new App({ messageLogger });

  function handleError(err, ctx) {
    if (ctx == null) {
      logger.error({ err, event: 'error' }, 'Unhandled exception occured');
    }
  }

  async function terminate(signal) {
    try {
      await app.terminate();
    } finally {
      logger.info({ signal, event: 'terminate' }, 'App is terminated');
      process.kill(process.pid, signal);
    }
  }

  // Handle uncaught errors
  app.on('error', handleError);

  // Initial task check
  taskQueue.pop().then((task) => {
    if (task) {
      console.log('got a task!');
      taskInProcess.setTask(task);
    }
  });

  // Start server
  if (!module.parent) {
    const server = app.listen(config.port, config.host, () => {
      logger.info({ event: 'execute' }, `API server listening on ${config.host}:${config.port}, in ${config.env}`);
    });
    server.on('error', handleError);

    const errors = ['unhandledRejection', 'uncaughtException'];
    errors.map(error => {
      process.on(error, handleError);
    });

    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    signals.map(signal => {
      process.once(signal, () => terminate(signal));
    });
  }

  return app;
};

if (require.main === module) {
  initApp();
}

// Expose app
module.exports = initApp;
