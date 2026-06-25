# 手账素材小程序 — 前后端分离迁移计划

## Context

当前项目是一个手账素材市场小程序，前端使用原生微信小程序（WXML/WXSS/JS），后端使用 Node.js Express + Sequelize ORM。需要将前端迁移到 uni-app（Vue 3），后端迁移到 SpringBoot 3 + MyBatis-Plus，采用渐进式迁移策略，新旧代码可并行运行。

## 前置条件

| 依赖 | 版本要求 | 用途 |
|------|----------|------|
| Java | 17+ | SpringBoot 3 最低要求 |
| Maven | 3.9+ | 构建后端项目 |
| Node.js | 18+ | uni-app 前端构建 |
| Docker | 24+ | 容器化部署 |
| 微信开发者工具 | 最新稳定版 | 小程序预览和调试 |
| MySQL | 8.0 | 数据库（复用现有） |
| Redis | 7.x | 缓存（复用现有） |

## 回滚方案

任何阶段出现问题时，按以下步骤回滚：

### 后端回滚
1. Nginx 配置恢复：将 `/api/` 重新代理到 `server:3000`
2. 停止 SpringBoot 容器：`docker-compose stop backend`
3. 旧 Node.js 服务无需重启（一直在运行）

### 前端回滚
1. 在微信公众平台重新上传旧版小程序代码（`miniprogram/` 目录）
2. 提交审核并发布旧版本
3. 用户端自动更新到旧版本（小程序冷启动时拉取最新已发布版本）

### 数据库回滚
- Phase 0-2 无表结构变更，无需回滚
- Phase 3.4 新增 `favorites` 表后如需回滚：`DROP TABLE IF EXISTS favorites;`
- 建议在执行 Phase 3.4 前备份数据库：`mysqldump -u root -p journaling_materials_hub > backup_pre_phase3.sql`

---

## Phase 0: 项目脚手架搭建

**复杂度**: 中等 | **预估**: 2-3 天

### 0.1 目录结构

保持旧代码不动，在 `journaling-materials-hub/` 下新建：

```
journaling-materials-hub/
  frontend/                    # 新：uni-app Vue 3 项目
  backend/                     # 新：SpringBoot Maven 项目
  miniprogram/                 # 保留：旧微信小程序
  server/                      # 保留：旧 Node.js 后端
  docker-compose.yml           # 修改：加入新服务
  docker-compose.old.yml       # 备份当前配置
```

### 0.2 后端脚手架（SpringBoot 3 + Maven）

**核心文件**:
- `backend/pom.xml` — SpringBoot 3.2.5, MyBatis-Plus 3.5.5, MySQL, JWT (jjwt 0.12.5), Redis, SpringDoc OpenAPI, Lombok
- `backend/src/main/java/com/journaling/hub/JournalingMaterialsHubApplication.java` — 启动类
- `backend/src/main/resources/application.yml` — 数据库、Redis、JWT、微信配置
- `backend/Dockerfile` — 基于 eclipse-temurin:17-jre-alpine

**包结构**:
```
com.journaling.hub/
  config/        — CorsConfig, RedisConfig, SwaggerConfig, WebMvcConfig
  common/        — Result, PageResult, ErrorCode, BusinessException, GlobalExceptionHandler
  entity/        — User, Material, RedeemCode, Download
  mapper/        — MyBatis-Plus Mapper 接口
  service/       — 接口 + impl/
  controller/    — REST 控制器
  filter/        — JWT 认证过滤器
  util/          — JwtUtil, WeChatUtil
  dto/           — 请求/响应 DTO
```

### 0.3 前端脚手架（uni-app Vue 3）

**核心文件**:
- `frontend/package.json` — Vue 3.4+, Pinia 2.1+, @dcloudio/uni-app（使用 HBuilderX 或 CLI 最新稳定版，避免使用过时的特定版本号）
- `frontend/pages.json` — 路由和 tabBar 配置（3 个 tab + 1 个子页面）
- `frontend/manifest.json` — 平台配置
- `frontend/App.vue`, `frontend/main.js`

**目录结构**:
```
frontend/src/
  api/           — request.js (封装 uni.request + JWT), user.js, material.js, redeem.js, download.js
  stores/        — Pinia: user.js (登录态), material.js (素材列表)
  pages/         — index/, detail/, tools/, profile/
  components/    — MaterialCard, WaterfallLayout, RedeemModal, LoadingSpinner, EmptyState
  utils/         — storage.js, auth.js
  static/        — 图标（从 miniprogram/assets/icons 复制）
```

### 0.4 Docker Compose 更新

- 新增 `backend` 服务（端口 8080），与旧 `server`（端口 3000）并行
- Nginx 新增 `location /api/v2/` 代理到新后端，`/api/` 继续代理到旧后端
- 共享 MySQL 和 Redis

### 0.5 验证标准

1. `mvn clean compile` 编译成功
2. `mvn spring-boot:run` 应用启动（即使数据库未配置也能启动，仅报连接错误）
3. `npm run dev:mp-weixin` 生成可运行的小程序项目
4. `docker-compose up backend` 容器正常启动
5. `curl http://localhost:8080/actuator/health` 返回 UP
6. 旧 Node.js 服务器在 3000 端口正常运行不受影响

---

## Phase 1: 后端核心开发（SpringBoot）

**复杂度**: 高 | **预估**: 5-7 天 | **依赖**: Phase 0

### 1.1 实体类（映射现有 4 张表）

| 文件 | 表名 | 关键字段 |
|------|------|----------|
| `entity/User.java` | users | id, openid, nickname, avatarUrl, phone, memberType(ENUM), memberExpireTime, points, downloadCount, status |
| `entity/Material.java` | materials | id, title, description, imageUrl, thumbnailUrl, category, tags(JSON), isPremium, downloadCount, status, sortOrder |
| `entity/RedeemCode.java` | redeem_codes | id, code, type, status, userId, usedTime, expireTime |
| `entity/Download.java` | downloads | id, userId, materialId, downloadedAt |

使用 `@TableName`, `@TableId(type=IdType.AUTO)`, `@TableField("snake_case")` 注解，Lombok `@Data`。

### 1.2 Mapper 接口

- `UserMapper extends BaseMapper<User>`
- `MaterialMapper extends BaseMapper<Material>` — 自定义 `searchMaterials()` 带 LIKE 查询
- `RedeemCodeMapper extends BaseMapper<RedeemCode>`
- `DownloadMapper extends BaseMapper<Download>`

XML Mapper: `resources/mapper/MaterialMapper.xml`（复杂搜索查询）

### 1.3 Service 层

**UserService**:
- `findOrCreateByOpenid(String openid)` — 查找或创建用户
- `getProfile(Long userId)` / `updateProfile(...)`
- `activatePremium(Long userId, String type, int durationDays)` — 计算过期时间
- `getUserStats(Long userId)` — 统计下载数、收藏数

**MaterialService**:
- `listMaterials(page, limit, category, keyword)` — LambdaQueryWrapper + Page 分页
- `getDetail(Long id)`
- `getCategories()` — GROUP BY 统计

**RedeemCodeService**:
- `verifyCode(String code)` — 验证码有效性
- `activate(Long userId, String code)` — 消费兑换码、激活会员、生成新 JWT

**DownloadService**:
- `download(Long userId, Long materialId)` — 权限检查 + 记录下载 + 计数器递增
- `getUserDownloads(Long userId, page, limit)` — 下载历史分页

### 1.4 Controller 层（13 个 API 端点）

**关键约束**: 响应格式必须与现有格式完全一致：
- 成功: `{ "success": true, "data": {...} }`
- 失败: `{ "success": false, "error": { "message": "...", "statusCode": 400 } }`

| Controller | 端点 | 认证 |
|-----------|------|------|
| UserController | POST /api/user/login | 公开 |
| | GET /api/user/profile | 必须认证 |
| | PUT /api/user/profile | 必须认证 |
| | GET /api/user/premium-status | 必须认证 |
| | GET /api/user/stats | 必须认证 |
| MaterialController | GET /api/materials | 可选认证 |
| | GET /api/materials/search | 可选认证 |
| | GET /api/materials/categories | 公开 |
| | GET /api/materials/{id} | 可选认证 |
| RedeemController | POST /api/redeem/verify | 必须认证 |
| | POST /api/redeem/activate | 必须认证 |
| DownloadController | GET /api/download/{materialId} | 必须认证 |
| | GET /api/download/records | 必须认证 |

### 1.5 JWT 认证

- `JwtUtil`: 生成/解析 token，claims 包含 `userId`, `openid`, `isPremium`
- `JwtAuthenticationFilter`: 实现 `OncePerRequestFilter`
- 使用拦截器区分"必须认证"和"可选认证"路径

### 1.6 微信登录集成

- `WeChatUtil.jscode2session(code)` — 调用微信 jscode2session API 获取 openid
- 使用 RestTemplate 或 WebClient

### 1.7 Redis 配置

- 配置 `RedisTemplate` + Jackson 序列化
- 缓存目标在 Phase 3 实现，此处仅搭建基础设施

### 1.8 全局异常处理

- `GlobalExceptionHandler` — `@RestControllerAdvice`
- 统一返回匹配的错误格式

### 1.9 API 文档

- SpringDoc OpenAPI 3，访问 `/swagger-ui.html`
- 配置 JWT Bearer 安全方案

### 1.10 验证标准

1. `mvn clean package` 生成可运行 JAR
2. 连接现有 MySQL 数据库成功
3. 13 个 API 端点响应正确，格式与 Node.js 一致
4. JWT 认证：无 token 返回 401，有 token 返回 200
5. 可选认证：`/api/materials` 有无 token 都返回数据
6. Swagger UI 可访问
7. 新旧后端可同时运行在同一数据库上

### 1.11 Mock 数据方案（支持前后端并行开发）

为避免前端等待后端全部完成，Phase 1 开发期间同步搭建 Mock 数据，使 Phase 2 可并行启动。

**方案**: 使用 `moco`（Java Mock Server）或前端本地 JSON Mock

**Mock 文件**（放在 `frontend/mock/` 目录）:
```
frontend/mock/
  user-login.json          — POST /api/user/login 响应
  user-profile.json        — GET /api/user/profile 响应
  user-stats.json          — GET /api/user/stats 响应
  materials-list.json      — GET /api/materials 响应（含分页）
  material-detail.json     — GET /api/materials/:id 响应
  materials-categories.json — GET /api/materials/categories 响应
  redeem-verify.json       — POST /api/redeem/verify 响应
  redeem-activate.json     — POST /api/redeem/activate 响应
  download-record.json     — GET /api/download/records 响应
```

**切换机制**: `frontend/src/api/request.js` 中通过环境变量切换：
- `VITE_API_MODE=mock` → 使用本地 JSON 文件
- `VITE_API_MODE=real` → 请求真实后端 API

**并行开发流程**:
1. Phase 1 启动后，立即生成 Mock JSON（基于 API 文档和旧代码响应结构）
2. Phase 2 使用 Mock 数据开发和调试前端页面
3. Phase 1 完成后，切换到真实 API 进行联调
4. 联调阶段重点验证数据格式差异

---

## Phase 2: 前端核心开发（uni-app）

**复杂度**: 高 | **预估**: 5-7 天 | **依赖**: Phase 0（可与 Phase 1 并行，使用 Mock 数据）

### 2.1 请求封装

`api/request.js`:
- 封装 `uni.request`，baseURL 可配置
- 请求拦截器：读取 token，附加 `Authorization: Bearer` 头
- 响应拦截器：401 清除 token 并重定向，非 200 拒绝

API 模块：`user.js`, `material.js`, `redeem.js`, `download.js`

### 2.2 Pinia 状态管理

**user store**: token, userInfo, isPremium, isLoggedIn, login(), logout(), refreshProfile()
**material store**: materials, leftColumn, rightColumn, page, hasMore, isLoading, loadMaterials(), searchMaterials()

### 2.3 页面迁移（4 个页面）

WXML → Vue 模板语法转换规则：
- `wx:for` → `v-for`
- `wx:if` → `v-if`
- `bindtap` → `@tap`
- `this.setData({})` → 直接赋值 ref
- `onLoad` → `onLoad()` from `@dcloudio/uni-app`
- `wx.*` API → `uni.*` API

| 页面 | 文件 | 功能 |
|------|------|------|
| 首页 | `pages/index/index.vue` | 瀑布流、搜索、分类筛选、无限滚动 |
| 详情 | `pages/detail/detail.vue` | 素材详情、图片预览、下载、兑换弹窗 |
| 工具 | `pages/tools/tools.vue` | 静态工具链接、复制到剪贴板 |
| 我的 | `pages/profile/profile.vue` | 用户信息、会员状态、兑换、登出 |

### 2.4 共享组件

- `MaterialCard.vue` — 素材卡片（缩略图、标题、VIP 标识、模糊遮罩）
- `WaterfallLayout.vue` — 瀑布流布局（左右分列）
- `RedeemModal.vue` — 兑换码弹窗（详情页和我的页共享）
- `LoadingSpinner.vue` / `EmptyState.vue`

### 2.5 验证标准

1. `npm run dev:mp-weixin` 编译无错误
2. 微信开发者工具中 4 个页面正确渲染
3. TabBar 3 个 item 显示正确
4. 首页：瀑布流加载、搜索、分类筛选、无限滚动正常
5. 详情页：详情加载、下载（免费素材）、兑换弹窗正常
6. 工具页：链接渲染、复制功能正常
7. 我的页：登录流程、用户信息、兑换、登出正常
8. JWT token 跨页面持久化
9. 错误处理：401 触发重新登录，网络错误显示 toast

---

## Phase 3: 功能完善

**复杂度**: 中等 | **预估**: 4-5 天 | **依赖**: Phase 1, Phase 2

### 3.1 云存储集成

- `StorageService` 接口 + `QiniuStorageServiceImpl` / `TencentCosStorageServiceImpl`
- `@ConditionalOnProperty` 选择实现
- 生成签名下载 URL

### 3.2 图片处理

- `ImageProcessingService` — 使用 `thumbnailator` 生成缩略图
- 用于管理员素材上传

### 3.3 Redis 缓存

- 素材列表缓存：`materials:list:{category}:{page}` TTL 5min
- 素材详情缓存：`materials:detail:{id}` TTL 10min
- 分类缓存：`materials:categories` TTL 30min
- 用户资料缓存：`user:profile:{userId}` TTL 5min
- 缓存失效：素材/用户更新时清除

### 3.4 收藏功能（新功能）

- 新建 `favorites` 表（id, user_id, material_id, created_at）
- 后端：Favorite 实体、Mapper、Service、Controller
- 前端：收藏按钮、收藏列表页

### 3.5 管理端 API + 管理后台前端

**后端 API**:
- `/api/admin/materials` — CRUD 素材
- `/api/admin/users` — 用户列表
- `/api/admin/redeem-codes/generate` — 生成兑换码
- 管理员角色校验

**管理后台前端**（使用 uni-app H5 模式，复用同一套代码）:
```
frontend/src/pages/admin/
  index.vue          — 管理后台首页（数据概览）
  materials.vue      — 素材管理（列表、新增、编辑、删除）
  users.vue          — 用户管理（列表、禁用/启用）
  redeem-codes.vue   — 兑换码管理（生成、列表、导出）
```

**路由隔离**: 在 `pages.json` 中配置管理端路由，通过 `/admin` 前缀区分，使用独立的登录鉴权（管理员角色校验）。

**访问方式**: 开发阶段通过 `npm run dev:h5` 在浏览器访问管理后台，生产环境通过 Nginx 配置独立域名或路径。

### 3.6 性能基线

迁移前后对比 API 响应时间，确保不退化。在 Phase 1 完成后执行基线测试：

| 接口 | 目标响应时间 | 测试方法 |
|------|-------------|----------|
| GET /api/materials（列表） | < 200ms（无缓存）/ < 50ms（有缓存） | ab -n 1000 -c 50 |
| GET /api/materials/:id（详情） | < 100ms | ab -n 1000 -c 50 |
| POST /api/user/login | < 500ms（含微信 API 调用） | 手动测试 |
| GET /api/materials/categories | < 50ms | ab -n 1000 -c 50 |

**工具**: 使用 Apache Bench (`ab`) 或 `wrk` 进行压力测试，记录 P50/P95/P99 延迟。

**对比方式**:
1. 先对旧 Node.js 后端执行压力测试，记录基线数据
2. 新 SpringBoot 后端完成后，同样条件下测试
3. 结果记录到 `docs/performance-benchmark.md`

### 3.7 验证标准

1. 云存储上传/下载正常
2. 缩略图生成正常
3. Redis 缓存命中（第二次请求不查库）
4. 收藏功能完整
5. 管理端 API 正常
6. 管理后台前端页面可访问、功能正常
7. 性能基线数据已记录，无明显退化

---

## Phase 4: 测试与部署

**复杂度**: 中等 | **预估**: 3-4 天 | **依赖**: Phase 1-3

### 4.1 后端测试

- 单元测试：Mockito mock Mapper 层，测试业务逻辑
- 集成测试：`@SpringBootTest` + MockMvc，测试完整请求链路
- JWT 测试：token 生成、解析、过期

### 4.2 前端测试

- Pinia store 测试（mock API）
- 组件测试（@vue/test-utils）
- 请求工具测试

### 4.3 Docker Compose 最终化

- 移除旧 Node.js 服务（迁移验证后）
- Nginx 配置最终化：`/api/` → backend:8080
- 更新 `.env.example`

### 4.4 小程序审核与发布

uni-app 编译输出的小程序需要重新提交微信审核，不能直接复用原生小程序的审核记录。

**时间规划**:
| 步骤 | 预估时间 | 说明 |
|------|----------|------|
| 代码上传 | 1 天 | 在微信开发者工具中上传编译产物 |
| 提交审核 | 1-3 个工作日 | 微信审核通常 1-3 天，首次可能更久 |
| 审核通过后发布 | 即时 | 审核通过后手动发布 |
| 灰度发布 | 1-2 天 | 建议先灰度 10% 用户观察 |

**注意事项**:
- 提前检查 uni-app 编译产物是否符合微信小程序规范（包大小、API 调用等）
- 准备审核说明文档，解释技术栈变更（从原生到 uni-app）
- 预留至少 1 周的审核缓冲时间
- 建议在审核期间保留旧版本小程序可用

### 4.5 部署文档

- `docs/migration-guide.md` — 迁移步骤
- `docs/deployment.md` — 新技术栈部署
- `README.md` — 更新项目说明

### 4.6 验证标准

1. `mvn test` 全部通过
2. `docker-compose up --build` 全部服务健康
3. 端到端流程：登录 → 浏览 → 详情 → 兑换 → 下载 → 查看统计
4. 性能基线对比无退化
5. 管理后台功能正常
6. 小程序审核通过并发布
7. 文档完整准确

---

## 跨阶段关注点

### 数据库兼容
新后端连接同一个 MySQL 数据库，Phase 0-2 无需修改表结构。仅 Phase 3.4 新增 `favorites` 表。使用 `@TableField("snake_case")` 匹配现有下划线列名。

### API 契约保持
响应格式必须完全一致：`{ success, data }` 或 `{ success, error: { message, statusCode } }`。自定义 `Result.java` 包装类实现。

### 并行运行策略
- 旧 Node.js 在 3000 端口（Nginx `/api/`）
- 新 SpringBoot 在 8080 端口（Nginx `/api/v2/`）
- 验证完成后切换 Nginx 路由
- 保留旧后端备用端口用于紧急回滚

### Token 兼容性
新旧后端使用相同的 `JWT_SECRET` 和 token 结构（`{ userId, openid, isPremium }`），确保迁移期间用户会话不中断。

---

## 总览

| 阶段 | 范围 | 复杂度 | 预估时间 | 关键风险 |
|------|------|--------|----------|----------|
| 0 | 脚手架搭建 | 中 | 2-3 天 | Maven 依赖冲突 |
| 1 | 后端核心（13 个 API + Mock 数据） | 高 | 5-7 天 | API 响应格式不匹配 |
| 2 | 前端核心（4 个页面） | 高 | 5-7 天 | uni-app 平台兼容性 |
| 3 | 功能完善（含管理后台 + 性能基线） | 中 | 4-5 天 | 云存储集成 |
| 4 | 测试、部署与审核 | 中 | 3-4 天 + 审核缓冲 1 周 | 小程序审核不通过 |

**总计预估**: 19-26 个工作日（开发）+ 1 周审核缓冲

### 并行开发时间线

采用 Mock 数据方案后，Phase 1 和 Phase 2 可并行：

```
Week 1:  [Phase 0 脚手架]
Week 2-3: [Phase 1 后端核心] ←→ [Phase 2 前端核心（Mock 数据）]
Week 4:  [前后端联调]
Week 5:  [Phase 3 功能完善]
Week 6:  [Phase 4 测试部署]
Week 7:  [小程序审核缓冲]
```

并行开发可将总周期从 6 周压缩到 5 周（不含审核缓冲）。

---

## 关键参考文件

- `server/src/controllers/userController.js` — 微信登录和 JWT 逻辑，必须精确复制
- `server/src/middleware/auth.js` — 三种认证模式（必须、可选、会员）
- `server/src/controllers/materialController.js` — `isBlurred` 会员内容模糊逻辑
- `miniprogram/utils/api.js` — API 契约定义（URL、方法、参数）
- `server/migrations/20260609-create-users.js` — 数据库表结构定义
