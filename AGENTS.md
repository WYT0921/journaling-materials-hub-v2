# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

手账素材小程序（Journaling Materials Hub）— 微信小程序，提供手账素材浏览、下载，支持兑换码激活会员。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | uni-app Vue 3 `frontend/` |
| 后端 | Spring Boot 3 `backend/` |
| ORM | MyBatis-Plus 3.5.5 |
| 认证 | JWT (jjwt 0.12.5) |

**基础设施**：MySQL 8.0、Redis 7、Nginx 反向代理、Docker Compose

## 常用命令

### Spring Boot 后端 (`backend/`)
```bash
cd backend
mvn spring-boot:run    # 开发模式 (port 8080)
mvn clean package -DskipTests  # 构建 JAR
mvn test               # 运行测试
```

### uni-app 前端 (`frontend/`)
```bash
cd frontend
npm install            # 安装依赖
npm run dev:mp-weixin  # 微信小程序开发构建
npm run build:mp-weixin # 微信小程序生产构建
npm run dev:h5         # H5 开发构建
npm run build:h5       # H5 生产构建
```

### Docker
```bash
docker-compose up -d           # 启动所有服务
docker-compose logs -f         # 查看日志
docker-compose stop backend    # 停止单个服务
```

### 生产部署（固定规则）

生产服务器固定为 `root@111.229.148.112`，项目根目录固定为 `/root/journaling-materials-hub/`，实际 Docker Compose 部署目录固定为 `/root/journaling-materials-hub/deploy/`。

部署时必须上传本地 `deploy/` 目录里的内容到服务器 `/root/journaling-materials-hub/deploy/`，使服务器该目录下直接包含：
`docker-compose.yml`、`backend/`、`admin-frontend/`、`nginx/`、`db/` 等文件/目录。

不要上传到 `/opt/journaling-hub`，也不要在服务器上形成 `/root/journaling-materials-hub/deploy/deploy/` 这种多套一层的目录。服务器真实环境变量文件为 `/root/journaling-materials-hub/deploy/.env`，部署包不应覆盖它。上传后在服务器执行：
```bash
cd /root/journaling-materials-hub/deploy
docker compose restart backend
docker compose ps
```

后端更新方式固定为“只更新 JAR，不重新构建 Docker 镜像”：

1. 本地执行 `cd backend && mvn clean package -DskipTests`
2. 上传 `backend/target/journaling-materials-hub-1.0.0.jar` 到服务器 `/root/journaling-materials-hub/deploy/backend/journaling-materials-hub-1.0.0.jar`
3. 在服务器执行 `cd /root/journaling-materials-hub/deploy && docker compose restart backend`
4. 验证 `docker compose ps` 和后端健康检查

除非用户明确要求重建镜像，否则不要执行 `docker compose up -d --build`，不要修改 Dockerfile，不要拉取基础镜像。

管理后台前端更新也必须沿用挂载目录方式：

1. 本地执行 `cd admin-frontend && npm run build`。
2. 将 `admin-frontend/dist/` **目录内的文件**同步至服务器 `/root/journaling-materials-hub/deploy/admin-frontend/dist/`。
3. 不得删除、移动或重新创建服务器上的 `dist` 目录本身，否则运行中 Nginx 容器的 bind mount 会继续指向旧目录节点，导致页面和分包文件 403/404。
4. 上传完成后仅执行 `cd /root/journaling-materials-hub/deploy && docker compose restart nginx`，让现有容器重新挂载目录；不要 `--force-recreate`，不要重建镜像，也不要影响 backend。
5. 验证首页和当前 `index.html` 引用的 `/assets/*.js` 均返回 HTTP 200。

## 架构

### 后端分层（Spring Boot）
```
com.journaling.hub/
  controller/   → REST 端点，返回 Result<T> 统一响应
  service/      → 业务逻辑（接口 + impl/ 实现）
  mapper/       → MyBatis-Plus Mapper 接口
  entity/       → 数据库实体（@TableName 注解）
  dto/          → 请求/响应 DTO
  common/       → Result, PageResult, ErrorCode, BusinessException
  config/       → CORS, Redis, Swagger, MyBatis-Plus, MinIO 配置
  filter/       → JwtAuthenticationFilter（拦截 /api/v2/**）
  util/         → JwtUtil, WeChatUtil
```

### 前端结构（uni-app Vue 3）
```
frontend/src/
  api/          → request.js (封装 uni.request + JWT), 各模块 API
  stores/       → Pinia 状态管理 (user.js, material.js, tools.js)
  pages/        → index, detail, tools, profile, premium, redeem, favorites
  components/   → MaterialCard, ToolCard, GlassNavBar, CustomTabBar 等
  utils/        → auth.js, storage.js
```

### 数据库（6 张表）
`users`、`materials`、`redeem_codes`、`downloads`、`tools`、`favorites`

### API 端点
完整文档见 `docs/api.md`。主要模块：
- 用户：微信登录、手机号绑定、个人信息
- 素材：列表（分页+筛选）、详情、搜索
- 兑换码：验证、激活
- 下载：记录、历史
- 收藏：切换、列表、检查（`/api/v2/favorites`）
- 工具箱：CRUD（`/api/v2/tools`）
- 管理后台：素材管理、用户管理（`/api/v2/admin`）

### 认证模式
- `REQUIRED` — 必须登录
- `OPTIONAL` — 可选登录（返回不同数据）
- `PREMIUM` — 需要会员权限

## 环境变量

### 后端配置
复制 `backend/src/main/resources/application-dev.yml.example` 为 `application-dev.yml`，填入真实配置。

或通过环境变量配置：
- `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` — 数据库连接
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` — Redis 连接
- `JWT_SECRET` — JWT 签名密钥（≥32 字符）
- `WECHAT_APPID` / `WECHAT_SECRET` — 微信小程序凭证
- `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` — MinIO 配置

### Docker 环境变量
复制 `.env.example` 为 `.env`，配置生产环境变量。

## 开发流程（重要约束）

### 1. 开发前 — 必读两份追踪文档

每次开始开发任务前，**必须先读取**以下两份文档了解当前状态：

| 文档 | 用途 |
|------|------|
| `docs/待完善问题.txt` | 问题清单（按严重程度分级：🔴严重 🟡中等 🟢轻微） |
| `docs/开发进度表.txt` | 开发进度总表（14 个模块，前后端逐项追踪） |

### 2. 按优先级阶段推进

严格按照优先级顺序，**禁止跨阶段开发**：

- 🔴 **第一优先** — 修复核心体验问题
- 🟡 **第二优先** — 补全核心功能
- 🟠 **第三优先** — 后端质量 + 安全
- 🟢 **第四优先** — 占位功能补全
- 🔵 **远期** — 体验优化

### 3. 阶段完成三步走

每个阶段完成后**必须**执行：

1. **Review 审查** — 检查代码质量、是否引入新问题、是否符合设计文档
2. **测试验证** — 后端 `mvn test`，前端 `npm run dev:mp-weixin` 构建验证
3. **更新文档** — 同步更新 `docs/待完善问题.txt` 和 `docs/开发进度表.txt` 中的状态

### 4. 前后端并行开发

- 每个阶段中，前端和后端的工作**同步进行**，不串行等待
- 使用共享 API 文档 `docs/api.md` 对齐接口契约

## 项目文档

| 文件 | 内容 |
|------|------|
| `docs/api.md` | API 接口文档 |
| `docs/database.md` | 数据库 Schema 与 ER 图 |
| `docs/deployment.md` | 部署指南（Nginx、SSL、域名备案） |
| `PROJECT_SUMMARY.md` | 项目总览 |
