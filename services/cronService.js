const cron = require('node-cron');
const sensorModel = require('../models/sensorData');
const { formatLocalTime } = require('../utils/timeUtil');

// 初始化所有定时任务
const initCronJobs = () => {
  // 每分钟统计任务
  cron.schedule('* * * * *', minuteTask);

  // 每小时统计任务
  cron.schedule('0 * * * *', hourlyTask);

  // 每日清理旧数据任务
  cron.schedule('0 0 * * *', dailyCleanupTask);

  // 每日数据完整性检查
  cron.schedule('30 3 * * *', dataIntegrityTask);

  console.log('所有定时任务已初始化');
};

// 每分钟统计任务
const minuteTask = async () => {
  const tempData = sensorModel.getTempData();
  if (tempData.temperature.length === 0) return;

  const now = new Date();
  now.setSeconds(0, 0);

  const avg = {
    temperature: tempData.temperature.reduce((a, b) => a + b, 0) / tempData.temperature.length,
    humidity: tempData.humidity.reduce((a, b) => a + b, 0) / tempData.humidity.length,
    light: tempData.light.reduce((a, b) => a + b, 0) / tempData.light.length
  };

  try {
    await sensorModel.saveMinuteData(now, avg.temperature, avg.humidity, avg.light);
    sensorModel.clearTempData();
    console.log(`分钟数据已保存: ${formatLocalTime(now)}`);
  } catch (err) {
    console.error('分钟统计任务失败:', err);
  }
};

// 每小时统计任务
const hourlyTask = async () => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // 调整时间范围计算逻辑
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(now.getHours() - 1);
      startTime.setMinutes(0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      // 使用格式化的时间
      const formattedStart = formatLocalTime(startTime);

      // 计算小时数据
      const result = await sensorModel.calculateHourlyData(startTime, endTime);
      
      // 数据有效性检查
      const { temperature, humidity, light, data_count } = result;
      if (data_count < 10) { 
        console.log(`数据点不足 (${data_count} 个) 于 ${formattedStart}`);
        break;
      }

      // 检查是否已存在记录
      const exists = await sensorModel.checkHourlyDataExists(formattedStart);
      
      if (!exists) {
        await sensorModel.saveHourlyData(formattedStart, temperature, humidity, light);
        console.log(`小时数据已保存: ${formattedStart}`);
      }
      break;
    } catch (err) {
      attempt++;
      console.error(`小时统计尝试 ${attempt} 失败:`, err);
      if (attempt === maxRetries) {
        console.error('小时统计在多次尝试后失败');
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// 每日清理旧数据任务
const dailyCleanupTask = async () => {
  try {
    await sensorModel.deleteOldMinuteData(2);
    console.log('旧的分钟数据已清理');
  } catch (err) {
    console.error('每日清理任务失败:', err);
  }
};

// 每日数据完整性检查任务
const dataIntegrityTask = async () => {
  try {
    // 查找缺失的小时数据
    const missingHours = await sensorModel.findMissingHourlyData(3);

    // 补录缺失数据
    for (const row of missingHours) {
      await sensorModel.fillMissingHourlyData(row.expected_hour);
      console.log(`补充了缺失的小时数据: ${row.expected_hour}`);
    }
    
    console.log(`数据完整性检查完成，补充了 ${missingHours.length} 个小时数据`);
  } catch (err) {
    console.error('数据完整性检查失败:', err);
  }
};

module.exports = {
  initCronJobs
}; 