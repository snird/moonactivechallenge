'use strict';

const Router = require('koa-router');
const miscController = require('./controllers/misc');
const echoAtTimeController = require('./controllers/echoAtTime');


const router = new Router();
router.get('/', miscController.getApiInfo);
router.get('/status', miscController.healthcheck);
router.post('/echoAtTime', echoAtTimeController.echoAtTime);

module.exports = router;
