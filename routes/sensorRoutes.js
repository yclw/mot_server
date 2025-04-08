const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

// POST /api/data - 接收传感器数据
router.post('/data', sensorController.receiveData);

// GET /api/latest-minute - 获取最新分钟数据
router.get('/latest-minute', sensorController.getLatestMinuteData);

// GET /api/hourly-last-24h - 获取24小时小时数据
router.get('/hourly-last-24h', sensorController.getHourlyLast24h);

// GET /api/hourly-past-days - 获取n天小时数据（排除今天）
router.get('/hourly-past-days', sensorController.getHourlyPastDays);

// GET /api/hourly-past-months - 获取n月小时数据
router.get('/hourly-past-months', sensorController.getHourlyPastMonths);

module.exports = router; 