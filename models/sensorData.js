const pool = require('../config/database');
const { formatLocalTime } = require('../utils/timeUtil');

// 临时存储每分钟数据
let tempData = {
  temperature: [],
  humidity: [],
  light: []
};

// 保存临时数据
const saveTempData = (temperature, humidity, light) => {
  tempData.temperature.push(temperature);
  tempData.humidity.push(humidity);
  tempData.light.push(light);
};

// 清空临时数据
const clearTempData = () => {
  tempData = { temperature: [], humidity: [], light: [] };
};

// 获取临时数据
const getTempData = () => {
  return tempData;
};

// 保存分钟数据
const saveMinuteData = async (datetime, temperature, humidity, light) => {
  try {
    await pool.query(
      'INSERT INTO minute_data (datetime, temperature, humidity, light) VALUES (?, ?, ?, ?)',
      [datetime, temperature, humidity, light]
    );
    return true;
  } catch (err) {
    console.error('保存分钟数据失败:', err);
    return false;
  }
};

// 保存小时数据
const saveHourlyData = async (datetime, temperature, humidity, light) => {
  try {
    await pool.query(
      'INSERT INTO hourly_data (datetime, temperature, humidity, light) VALUES (?, ?, ?, ?)',
      [datetime, temperature || 0, humidity || 0, light || 0]
    );
    return true;
  } catch (err) {
    console.error('保存小时数据失败:', err);
    return false;
  }
};

// 获取最新分钟数据
const getLatestMinuteData = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM minute_data ORDER BY datetime DESC LIMIT 1'
    );
    return rows[0] || {};
  } catch (err) {
    console.error('获取最新分钟数据失败:', err);
    throw err;
  }
};

// 获取24小时小时数据
const getHourlyLast24h = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM hourly_data 
      WHERE datetime >= NOW() - INTERVAL 24 HOUR
      ORDER BY datetime
    `);
    return rows;
  } catch (err) {
    console.error('获取24小时数据失败:', err);
    throw err;
  }
};

// 获取过去n天小时数据（排除今天）
const getHourlyPastDays = async (days) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM hourly_data 
      WHERE datetime >= CURDATE() - INTERVAL ? DAY
        AND datetime < CURDATE()
      ORDER BY datetime
    `, [days]);
    return rows;
  } catch (err) {
    console.error('获取过去n天数据失败:', err);
    throw err;
  }
};

// 获取过去n月小时数据
const getHourlyPastMonths = async (months) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM hourly_data 
      WHERE datetime >= CURDATE() - INTERVAL ? MONTH
      ORDER BY datetime
    `, [months]);
    return rows;
  } catch (err) {
    console.error('获取过去n月数据失败:', err);
    throw err;
  }
};

// 删除旧的分钟数据
const deleteOldMinuteData = async (days) => {
  try {
    await pool.query('DELETE FROM minute_data WHERE datetime < CURDATE() - INTERVAL ? DAY', [days]);
    return true;
  } catch (err) {
    console.error('删除旧数据失败:', err);
    return false;
  }
};

// 计算小时数据
const calculateHourlyData = async (startTime, endTime) => {
  try {
    const formattedStart = formatLocalTime(startTime);
    const formattedEnd = formatLocalTime(endTime);

    const [result] = await pool.query(`
      SELECT 
        AVG(NULLIF(temperature, 0)) AS temperature,
        AVG(NULLIF(humidity, 0)) AS humidity,
        AVG(NULLIF(light, 0)) AS light,
        COUNT(*) AS data_count
      FROM minute_data 
      WHERE datetime >= ? AND datetime < ?
        AND (temperature IS NOT NULL 
          OR humidity IS NOT NULL 
          OR light IS NOT NULL)
    `, [formattedStart, formattedEnd]);

    return result[0];
  } catch (err) {
    console.error('计算小时数据失败:', err);
    throw err;
  }
};

// 检查小时数据是否存在
const checkHourlyDataExists = async (datetime) => {
  try {
    const [existing] = await pool.query(
      'SELECT 1 FROM hourly_data WHERE datetime = ?', 
      [datetime]
    );
    return existing.length > 0;
  } catch (err) {
    console.error('检查小时数据是否存在失败:', err);
    throw err;
  }
};

// 查找缺失的小时数据
const findMissingHourlyData = async (days) => {
  try {
    const [missingHours] = await pool.query(`
      SELECT expected_hour 
      FROM (
        SELECT 
          DATE_FORMAT(datetime, '%Y-%m-%d %H:00:00') AS expected_hour
        FROM minute_data
        WHERE datetime > CURDATE() - INTERVAL ? DAY
        GROUP BY expected_hour
      ) m
      LEFT JOIN hourly_data h ON m.expected_hour = h.datetime
      WHERE h.datetime IS NULL
    `, [days]);
    
    return missingHours;
  } catch (err) {
    console.error('查找缺失小时数据失败:', err);
    throw err;
  }
};

// 补充缺失的小时数据
const fillMissingHourlyData = async (expectedHour) => {
  try {
    await pool.query(`
      INSERT INTO hourly_data (datetime, temperature, humidity, light)
      SELECT 
        ? AS hour,
        AVG(temperature),
        AVG(humidity),
        AVG(light)
      FROM minute_data
      WHERE datetime >= ? AND datetime < ? + INTERVAL 1 HOUR
    `, [expectedHour, expectedHour, expectedHour]);
    
    return true;
  } catch (err) {
    console.error(`补充缺失小时数据失败: ${expectedHour}`, err);
    return false;
  }
};

module.exports = {
  saveTempData,
  clearTempData,
  getTempData,
  saveMinuteData,
  saveHourlyData,
  getLatestMinuteData,
  getHourlyLast24h,
  getHourlyPastDays,
  getHourlyPastMonths,
  deleteOldMinuteData,
  calculateHourlyData,
  checkHourlyDataExists,
  findMissingHourlyData,
  fillMissingHourlyData
}; 