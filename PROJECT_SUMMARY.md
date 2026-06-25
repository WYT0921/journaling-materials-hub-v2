# 手账素材小程序 v2 - 项目总结

## 项目概述

手账素材管理微信小程序，采用 Uber 极简功能型设计风格，提供素材浏览、会员系统、兑换码激活等功能。

## 技术架构

| 层级 | 技术 |
|------|------|
| 前端 | uni-app Vue 3 + Pinia |
| 后端 | Spring Boot 3 + MyBatis-Plus 3.5.5 |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 存储 | MinIO |
| 认证 | JWT (jjwt 0.12.5) |
| 部署 | Docker Compose + Nginx |

## 项目结构

```
journaling-materials-hub-v2/
├── backend/                         # Spring Boot 后端
│   ├── src/main/java/com/journaling/hub/
│   │   ├── controller/              # REST 控制器
│   │   ├── service/                 # 业务逻辑层
│   │   ├── mapper/                  # MyBatis-Plus Mapper
│   │   ├── entity/                  # 数据库实体
│   │   ├── dto/                     # 请求/响应 DTO
│   │   ├── common/                  # Result, ErrorCode, PageResult
│   │   ├── config/                  # CORS, Redis, Swagger, MinIO, MyBatis-Plus
│   │   ├── filter/                  # JWT 认证过滤器
│   │   └── util/                    # JWT, WeChat 工具类
│   ├── src/main/resources/
│   │   ├── application.yml          # 公共配置
│   │   ├── application-dev.yml.example  # 开发配置模板
│   │   ├── application-prod.yml     # 生产配置
│   │   └── db/                      # Flyway 迁移脚本
│   ├── src/test/                    # 测试代码
│   └── pom.xml
├── frontend/                        # uni-app Vue 3 前端
│   ├── src/
│   │   ├── api/                     # API 封装
│   │   ├── pages/                   # 页面
│   │   ├── components/              # 组件
│   │   ├── stores/                  # Pinia 状态管理
│   │   └── utils/                   # 工具函数
│   └── package.json
├── nginx/                           # Nginx 反向代理配置
├── docs/                            # 项目文档
├── docker-compose.yml               # Docker 编排
└── .env.example                     # 环境变量模板
```

## 已完成的功能模块

### 后端 (Spring Boot)
- [x] 用户模块：微信登录、手机号绑定、个人信息
- [x] 素材模块：列表（分页+筛选）、详情、搜索
- [x] 兑换码模块：验证、激活
- [x] 下载模块：记录、历史
- [x] 收藏模块：切换、列表、检查
- [x] 工具箱模块：CRUD
- [x] 管理后台：素材管理、用户管理
- [x] JWT 认证过滤器
- [x] MinIO 文件存储集成
- [x] 单元测试（Service + Controller）

### 前端 (uni-app Vue 3)
- [x] 首页：瀑布流、分类筛选、搜索
- [x] 素材详情页
- [x] 工具页
- [x] 我的页面
- [x] 会员中心
- [x] 兑换码激活
- [x] 收藏列表
- [x] API 请求封装（JWT 自动注入）
- [x] Pinia 状态管理
- [x] 组件库（MaterialCard, ToolCard, GlassNavBar 等）

### 部署配置
- [x] Docker Compose 编排
- [x] Nginx 反向代理配置
- [x] 环境变量模板

## API 接口

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 用户 | `/api/v2/user` | 微信登录、手机号绑定、个人信息 |
| 素材 | `/api/v2/materials` | 列表、详情、搜索 |
| 兑换码 | `/api/v2/redeem` | 验证、激活 |
| 下载 | `/api/v2/downloads` | 记录、历史 |
| 收藏 | `/api/v2/favorites` | 切换、列表、检查 |
| 工具箱 | `/api/v2/tools` | CRUD |
| 管理后台 | `/api/v2/admin` | 素材管理、用户管理 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` | 数据库连接 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） |
| `WECHAT_APPID` / `WECHAT_SECRET` | 微信小程序凭证 |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` | MinIO 存储 |

## 安全注意事项

- **绝不提交** `application-dev.yml` 和 `.env` 文件（已在 .gitignore 中排除）
- 使用强密码，定期轮换密钥
- 生产环境关闭 Swagger UI

## 许可证

MIT License
