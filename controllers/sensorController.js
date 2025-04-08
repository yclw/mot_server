const sensorModel = require('../models/sensorData');

// 接收传感器数据的控制器
const receiveData = (req, res) => {
  const { temperature, humidity, light } = req.body;
  console.log(`POST,nowTime: ${new Date()}`);
  console.log(`${temperature},${humidity},${light}`);
  
  // 数据校验
  if ([temperature, humidity, light].every(Number.isFinite)) {
    console.log(`Y`);
    sensorModel.saveTempData(temperature, humidity, light);
    res.status(200).send('Data received');
  } else {
    console.log(`F`);
    res.status(400).send('Invalid data');
  }
};

// 获取最新分钟数据的控制器
const getLatestMinuteData = async (req, res) => {
  try {
    const data = await sensorModel.getLatestMinuteData();
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// 获取24小时小时数据的控制器
const getHourlyLast24h = async (req, res) => {
  try {
    const data = await sensorModel.getHourlyLast24h();
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// 获取过去n天小时数据的控制器
const getHourlyPastDays = async (req, res) => {
  const days = parseInt(req.query.days) || 1;
  try {
    const data = await sensorModel.getHourlyPastDays(days);
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// 获取过去n月小时数据的控制器
const getHourlyPastMonths = async (req, res) => {
  const months = parseInt(req.query.months) || 1;
  try {
    const data = await sensorModel.getHourlyPastMonths(months);
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  receiveData,
  getLatestMinuteData,
  getHourlyLast24h,
  getHourlyPastDays,
  getHourlyPastMonths
}; 