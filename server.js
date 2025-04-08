require('dotenv').config();
const express = require('express');
const sensorRoutes = require('./routes/sensorRoutes');
const cronService = require('./services/cronService');

// 设置时区
process.env.TZ = 'Asia/Shanghai';

// 创建Express应用
const app = express();
app.use(express.json());

// 使用路由
app.use('/api', sensorRoutes);

// 初始化定时任务
cronService.initCronJobs();

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}, 当前时间: ${new Date()}`)); 