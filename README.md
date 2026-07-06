# 手账素材小程序 v2

手账素材管理微信小程序，采用 Uber 极简功能型设计风格。

## 功能特性

- **首页** — 瀑布流布局，分类筛选，搜索素材
- **素材详情** — 大图展示，会员权限控制，下载
- **工具箱** — 排版/配色/字体工具集合
- **我的** — 用户信息，会员状态，兑换码激活，下载记录，收藏
- **管理后台** — 素材管理，用户管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | uni-app Vue 3 |
| 后端 | Spring Boot 3 + MyBatis-Plus |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 存储 | MinIO |
| 部署 | Docker Compose + Nginx |

## 项目结构

```
journaling-materials-hub-v2/
├── backend/                         # Spring Boot 后端
│   ├── src/main/java/com/journaling/hub/
│   │   ├── controller/              # REST 控制器
│   │   ├── service/                 # 业务逻辑
│   │   ├── mapper/                  # MyBatis-Plus Mapper
│   │   ├── entity/                  # 数据库实体
│   │   ├── dto/                     # 请求/响应 DTO
│   │   ├── common/                  # 通用类（Result, ErrorCode 等）
│   │   ├── config/                  # 配置（CORS, Redis, Swagger, MinIO）
│   │   ├── filter/                  # JWT 认证过滤器
│   │   └── util/                    # 工具类（JWT, WeChat）
│   ├── src/main/resources/
│   │   ├── application.yml          # 公共配置（可提交）
│   │   ├── application-dev.yml.example  # 开发环境配置模板
│   │   ├── application-prod.yml     # 生产环境配置
│   │   └── db/                      # Flyway 数据库迁移
│   └── pom.xml
├── frontend/                        # uni-app Vue 3 前端
│   ├── src/
│   │   ├── api/                     # API 封装
│   │   ├── pages/                   # 页面
│   │   ├── components/              # 组件
│   │   ├── stores/                  # Pinia 状态管理
│   │   └── utils/                   # 工具函数
│   └── package.json
├── nginx/                           # Nginx 配置
├── docs/                            # 项目文档
├── docker-compose.yml               # Docker 编排
└── .env.example                     # 环境变量模板
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/WYT0921/journaling-materials-hub-v2.git
cd journaling-materials-hub-v2
```

### 2. 后端设置

```bash
cd backend

# 配置开发环境
cp src/main/resources/application-dev.yml.example src/main/resources/application-dev.yml
# 编辑 application-dev.yml，填入数据库、Redis、微信等配置

# 启动开发服务器
mvn spring-boot:run
```

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 微信小程序开发构建
npm run dev:mp-weixin

# 或 H5 开发
npm run dev:h5
```

### 4. Docker 部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env，填入生产环境配置

# 启动所有服务
docker-compose up -d
```

## API 接口

完整文档见 `docs/api.md`。

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
| `DB_POOL_MAX_LIFETIME` / `DB_POOL_KEEPALIVE_TIME` / `DB_POOL_IDLE_TIMEOUT` / `DB_POOL_VALIDATION_TIMEOUT` | 数据库连接池超时配置（毫秒） |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） |
| `WECHAT_APPID` / `WECHAT_SECRET` | 微信小程序凭证 |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` | MinIO 存储 |

## 许可证

MIT License — 查看 [LICENSE](LICENSE) 文件了解详情
