# 传感器数据收集与分析系统

这是一个用于收集和分析传感器数据（温度、湿度、光照）的后端服务系统。

## 项目结构

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

## 功能特点

- 实时接收传感器数据
- 按分钟、小时计算统计数据
- 定时清理旧数据
- 数据完整性检查，自动补充缺失数据
- 提供RESTful API查询数据

## API接口

- `POST /api/data` - 接收传感器数据
- `GET /api/latest-minute` - 获取最新分钟数据
- `GET /api/hourly-last-24h` - 获取24小时小时数据
- `GET /api/hourly-past-days?days=n` - 获取过去n天小时数据
- `GET /api/hourly-past-months?months=n` - 获取过去n月小时数据

## 启动方法

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量（可编辑.env文件）：
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=sensordata
PORT=3000
```

3. 启动服务：
```bash
npm start
```

开发模式启动（自动重启）：
```bash
npm run dev
``` 