# 基于STM32的农业大棚环境监控系统-服务端

本项目是"基于STM32的农业大棚环境监控系统"的服务端部分，负责接收、处理、存储和提供查询STM32终端采集的环境数据（温度、湿度、光照）。

## 项目功能

### 1. 数据采集功能
- 通过REST API接收STM32设备上传的环境数据
- 对接收的数据进行合法性验证，确保数据可靠

### 2. 数据处理功能
- 按分钟对原始数据进行聚合计算，生成分钟级统计数据
- 按小时对分钟数据进行聚合计算，生成小时级统计数据
- 支持数据异常检测与处理，如零值过滤

### 3. 数据存储管理
- 分级存储策略：原始数据临时存储，分钟数据短期存储，小时数据长期存储
- 自动清理过期数据，优化数据库性能和存储空间
- 数据完整性自动检查与修复，确保数据连续性

### 4. 数据查询接口
- 提供最新环境数据实时查询接口
- 提供24小时内环境数据趋势查询接口
- 支持按天查询历史数据功能
- 支持按月查询长期数据统计功能

### 5. 系统监控与维护
- 定时任务管理和故障重试机制
- 详细的日志记录，便于问题排查与系统优化

## 系统架构

项目采用模块化分层架构，遵循关注点分离原则：

### 技术栈
- 后端框架：Node.js + Express
- 数据库：MySQL
- 定时任务：node-cron
- 环境配置：dotenv

### 架构分层
```
├── config/             # 配置文件
│   └── database.js     # 数据库配置
├── controllers/        # 控制器
│   └── sensorController.js  # 传感器数据控制器
├── models/             # 数据模型
│   └── sensorData.js   # 传感器数据模型
├── routes/             # 路由
│   └── sensorRoutes.js # API路由
├── services/           # 服务
│   └── cronService.js  # 定时任务服务
├── utils/              # 工具函数
│   └── timeUtil.js     # 时间处理工具
├── .env                # 环境变量
├── package.json        # 项目信息和依赖
├── README.md           # 项目说明
└── server.js           # 主程序入口
```

## 数据流程

1. STM32设备采集环境数据，通过网络上传至服务器
2. 服务器接收数据，进行验证后存入临时缓存
3. 每分钟定时任务聚合缓存中的数据，计算平均值后存入分钟数据表
4. 每小时定时任务聚合分钟数据，计算平均值后存入小时数据表
5. 客户端通过API查询各级数据，用于监控和分析

## 定时任务

系统内置多个定时任务，确保数据的处理和管理：

1. **分钟统计任务**：每分钟执行一次，聚合临时数据
2. **小时统计任务**：每小时执行一次，聚合分钟数据
3. **数据清理任务**：每天执行一次，清理过期的分钟数据
4. **数据完整性检查**：每天凌晨执行，检查并修复缺失的小时数据记录

## 系统API接口

- `POST /api/data` - 接收传感器数据
- `GET /api/latest-minute` - 获取最新分钟数据
- `GET /api/hourly-last-24h` - 获取24小时小时数据
- `GET /api/hourly-past-days?days=n` - 获取过去n天小时数据
- `GET /api/hourly-past-months?months=n` - 获取过去n月小时数据

## 数据库设计

系统使用MySQL数据库，包含两个主要表：

1. **minute_data表**：存储分钟级数据
   - datetime: 时间戳
   - temperature: 温度平均值
   - humidity: 湿度平均值
   - light: 光照平均值

2. **hourly_data表**：存储小时级数据
   - datetime: 时间戳
   - temperature: 温度平均值
   - humidity: 湿度平均值
   - light: 光照平均值

## 环境搭建

### 基础环境要求
- Node.js (v14+)
- MySQL数据库 (v5.7+)
- npm包管理器

### 数据库准备
1. 创建MySQL数据库：
```sql
CREATE DATABASE sensordata;
```

2. 创建必要的表：
```sql
USE sensordata;

CREATE TABLE minute_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  datetime DATETIME NOT NULL,
  temperature FLOAT,
  humidity FLOAT,
  light FLOAT,
  INDEX idx_datetime (datetime)
);

CREATE TABLE hourly_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  datetime DATETIME NOT NULL,
  temperature FLOAT,
  humidity FLOAT,
  light FLOAT,
  INDEX idx_datetime (datetime)
);
```

### 安装步骤

1. 克隆或下载项目代码到服务器

2. 安装项目依赖
```bash
npm install
```

3. 配置环境变量
创建或编辑.env文件，设置以下参数：
```
DB_HOST=数据库主机地址
DB_USER=数据库用户名
DB_PASSWORD=数据库密码
DB_NAME=sensordata
PORT=3000
```

4. 启动服务
```bash
npm start
```

5. 开发模式运行（支持热重载）
```bash
npm run dev
```

### 部署建议

1. 生产环境部署：
   - 推荐使用PM2进行进程管理
   - 设置日志轮转，避免日志文件过大
   - 配置防火墙只开放必要端口

2. 数据备份：
   - 定期备份数据库
   - 可考虑使用MySQL主从复制提高可靠性 