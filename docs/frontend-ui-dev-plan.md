# 手账素材小程序 — 前后端并行开发总计划

## Context

当前 uni-app Vue 3 前端（`frontend/`）已有 4 个页面和 4 个组件的骨架实现，但 UI 风格与设计文档差距较大；Spring Boot 后端（`backend/`）13 个 API 端点已全部实现，但缺少收藏模块、单元测试和 SQL 迁移脚本。本计划覆盖前后端全部开发任务，每个 Phase 中前端和后端并行推进，完成后统一验证。

---

## 技术架构决策

### 1. 全局背景方案
- 在 `App.vue` 中实现粉绿渐变背景 + 12 颗浮动星星动画
- 渐变：`linear-gradient(135deg, #fef5f8, #f5fdf5, #fff8f0)`
- 星星：12 个绝对定位 `<view>`，交替 `#E8C4D4` / `#C8E6C9`，CSS animation 浮动

### 2. 毛玻璃兼容方案
- 微信小程序 Android X5 内核可能不支持 `backdrop-filter`
- 策略：`@supports (-webkit-backdrop-filter: blur())` 渐进增强，fallback 到纯 `rgba()` 半透明
- 全部页面使用 `navigationStyle: "custom"` 自定义导航栏

### 3. 自定义 TabBar
- 原生 TabBar 不支持 `backdrop-filter`，使用 `CustomTabBar.vue` 组件替代

### 4. 半屏弹窗统一
- `BottomSheet.vue` 通用组件，替代 `RedeemModal.vue`
- 用于：Unlock Premium 弹窗、添加工具弹窗

### 5. 前端 tools 状态管理
- `stores/tools.js` 管理默认工具 + 自定义工具 CRUD + localStorage 持久化

### 6. 后端新增收藏模块
- 新增 `Favorites` 实体/Mapper/Service/Controller（4 张新文件）
- 用户 stats 中的 `collectionCount` 从收藏表实时查询

---

## 开发计划（7 个阶段）

---

### Phase 0：基础层搭建（可并行）

**目标**：建立前后端的基础设施层

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 0.1 | 更新 uni.scss 主题变量 | `frontend/src/uni.scss` | 新增渐变/星星/毛玻璃/边框色变量 |
| 🔵 前端 | 0.2 | 全局渐变背景+星星动画 | `frontend/src/App.vue` | 粉绿渐变背景 + 12 颗浮动星星 |
| 🔵 前端 | 0.3 | GlassNavBar 组件 | `frontend/src/components/GlassNavBar.vue` | 毛玻璃导航栏（返回+标题+右侧槽） |
| 🔵 前端 | 0.4 | CustomTabBar 组件 | `frontend/src/components/CustomTabBar.vue` | 3 Tab 毛玻璃底栏 |
| 🔵 前端 | 0.5 | BottomSheet 组件 | `frontend/src/components/BottomSheet.vue` | 通用底部升起弹窗（把手条+插槽） |
| 🔵 前端 | 0.6 | CustomToast 组件 | `frontend/src/components/CustomToast.vue` | 黑底白字圆胶囊 Toast，全局单例 |
| 🔵 前端 | 0.7 | 配置 pages.json | `frontend/src/pages.json` | 全局 `navigationStyle: "custom"` + 自定义 tabBar |
| 🟢 后端 | 0.8 | SQL 迁移脚本初始化 | `backend/src/main/resources/db/` | 首次迁移脚本（建表 DDL + 种子数据） |
| 🟢 后端 | 0.9 | 分页默认值统一 | `backend/.../MaterialController.java` | limit 默认值从 10 改为 20，对齐 Node.js |

**验证**：
- 🔵 `npm run dev:mp-weixin` 构建 → 渐变背景、星星动画、毛玻璃 TabBar 正常显示
- 🟢 `mvn test` 通过 / 接口返回 `limit=20`

---

### Phase 1：首页 Feed 改造（可并行）

**目标**：首页完全匹配设计文档的黑白灰极简 Feed 风格

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 1.1 | 首页 Header 改造 | `frontend/src/pages/index/index.vue` | 使用 GlassNavBar，"发现 · Discover" + 通知按钮 |
| 🔵 前端 | 1.2 | 胶囊搜索框 | 同上 | `border-radius: 100rpx`，底色 `#F7F7F7`，右侧筛选 icon |
| 🔵 前端 | 1.3 | Chips 样式改造 | 同上 | 选中黑底白字，未选 1px `#EEEEEE` 边框 |
| 🔵 前端 | 1.4 | 瀑布流卡片改造 | `frontend/src/components/MaterialCard.vue` | 1px 边框、零阴影、半透明底、VIP 角标黑底白字 |
| 🔵 前端 | 1.5 | 底部已到底分隔线 | `frontend/src/pages/index/index.vue` | 列表底部横线 + 文字 |
| 🟢 后端 | 1.6 | 分类接口排序增强 | `backend/.../MaterialServiceImpl.java` | categories 按 count 降序排列 |
| 🟢 后端 | 1.7 | 搜索接口加强 | `backend/.../MaterialServiceImpl.java` | 支持多关键词空格分隔搜索 |

**验证**：
- 🔵 首页搜索、分类切换、瀑布流滚动正常，视觉匹配设计文档
- 🟢 分类按素材数量排序返回、多关键词搜索正常

---

### Phase 2：素材详情页改造（可并行）

**目标**：详情页完整实现免费/VIP 双状态 UI

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 2.1 | 毛玻璃导航栏 | `frontend/src/pages/detail/detail.vue` | GlassNavBar，返回+分享/更多 |
| 🔵 前端 | 2.2 | VIP 专属角标 | 同上 | 黑底白字"会员专属"（`isPremium && !userStore.isPremium`） |
| 🔵 前端 | 2.3 | 渐变遮罩 | 同上 | 大图底部渐变遮罩 + "查看高清原图需加入会员" |
| 🔵 前端 | 2.4 | 双 CTA 栏 | 同上 | 免费→单一"下载素材"黑按钮；VIP→左"预览"+右"解锁下载" |
| 🔵 前端 | 2.5 | Unlock Premium 弹窗 | 同上 | 使用 BottomSheet，皇冠icon+"解锁会员" |
| 🔵 前端 | 2.6 | 改写 RedeemModal | 删除 `RedeemModal.vue` | 改用 BottomSheet 统一弹窗 |
| 🟢 后端 | 2.7 | 下载 API 错误信息优化 | `backend/.../DownloadServiceImpl.java` | 返回更具体的错误原因（素材不存在/已下架/无权下载） |
| 🟢 后端 | 2.8 | 下载记录接口完善 | `backend/.../DownloadController.java` | 返回结果增加素材标题缩略图等预览信息 |

**验证**：
- 🔵 免费素材→直接下载；VIP 非会员→角标+遮罩+Unlock 弹窗→跳转兑换页
- 🟢 下载错误时返回具体原因文字；下载记录含素材预览信息

---

### Phase 3：工具页改造（可并行）

**目标**：工具页完整改造 + 添加工具流程 + localStorage 持久化

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 3.1 | 创建 tools store | `frontend/src/stores/tools.js` | 8 个默认工具 + 自定义工具 CRUD + localStorage |
| 🔵 前端 | 3.2 | 改写工具页结构 | `frontend/src/pages/tools/tools.vue` | "创作工具箱"+引导文案+分割线+2列网格 |
| 🔵 前端 | 3.3 | ToolCard 组件 | `frontend/src/components/ToolCard.vue` | 圆形淡灰底+线性图标，"复制链接"胶囊按钮 |
| 🔵 前端 | 3.4 | IconPicker 组件 | `frontend/src/components/IconPicker.vue` | 24 图标网格选择，选中黑底白字 |
| 🔵 前端 | 3.5 | 添加工具弹窗 | `frontend/src/pages/tools/tools.vue` | BottomSheet + 表单(名称/描述/图标/链接) + 校验 |
| 🔵 前端 | 3.6 | 自定义工具区域 | 同上 | 分隔线"自定义工具"+ 删除小叉 + Toast |
| 🔵 前端 | 3.7 | 复制链接功能 | 同上 | `uni.setClipboardData`，成功/失败 Toast |
| 🟢 后端 | 3.8 | 工具管理 API | `backend/.../controller/ToolController.java` | 新增工具 CRUD 接口（GET/POST/PUT/DELETE） |
| 🟢 后端 | 3.9 | 工具实体+表 | `backend/.../entity/Tool.java` + SQL 迁移 | 工具名称/描述/图标/链接/排序/是否为自定义 |

**验证**：
- 🔵 默认工具正常、添加→localStorage 持久化→刷新保留、删除正常、复制链接 Toast
- 🟢 工具 CRUD 接口正常工作

---

### Phase 4：个人中心 + 收藏功能（可并行）

**目标**：个人中心匹配设计文档 + 后端收藏模块完整实现

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 4.1 | 身份区改造 | `frontend/src/pages/profile/profile.vue` | 圆形头像+昵称；身份徽章（普通/会员） |
| 🔵 前端 | 4.2 | 数据统计条 | 同上 | 三列均分（下载/收藏/素材），tabular-nums 等宽 |
| 🔵 前端 | 4.3 | 双入口卡片 | 同上 | 会员中心黑底白字 + 兑换会员白卡灰框 + 右箭头 |
| 🔵 前端 | 4.4 | 底部设置列表 | 同上 | 设置/素材管理/关于/反馈建议，圆标+箭头，点按灰底 |
| 🔵 前端 | 4.5 | 功能入口对接 | 同上 | 设置项不再"功能开发中" |
| 🟢 后端 | 4.6 | 收藏实体+表 | `backend/.../entity/Favorite.java` + SQL 迁移 | `favorites` 表（user_id + material_id + created_at） |
| 🟢 后端 | 4.7 | 收藏 Mapper | `backend/.../mapper/FavoriteMapper.java` | BaseMapper + 自定义查询（用户收藏列表+分页） |
| 🟢 后端 | 4.8 | 收藏 Service | `backend/.../service/FavoriteService.java` + impl | toggle 收藏、检查是否已收藏、获取收藏列表、收藏计数 |
| 🟢 后端 | 4.9 | 收藏 Controller | `backend/.../controller/FavoriteController.java` | POST toggle、GET list（分页）、GET check/:materialId |
| 🟢 后端 | 4.10 | 收藏数据对接用户 stats | `backend/.../UserServiceImpl.java` | getUserStats 中 `collectionCount` 从 favorite 表实时查 |

**验证**：
- 🔵 登录/未登录状态正确、普通/会员徽章切换正确
- 🟢 收藏 API toggle/list/check 正常；`GET /api/user/stats` 返回真实收藏数

---

### Phase 5：新增页面开发（可并行）

**目标**：会员中心、兑换码输入、兑换结果 3 个新页面 + 后端单元测试

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 5.1 | 会员中心页 — 未开通 | `frontend/src/pages/premium/index.vue` | 灰底皇冠icon + 4 条权益 + "前往兑换" |
| 🔵 前端 | 5.2 | 会员中心页 — 已开通 | 同上 | 黑底白皇冠icon + 有效期 + 2x2 权益网格 |
| 🔵 前端 | 5.3 | 兑换码输入页 | `frontend/src/pages/redeem/index.vue` | 票据icon + 自动格式化输入框 + 校验 + loading 提交 |
| 🔵 前端 | 5.4 | 兑换结果页 — 成功态 | `frontend/src/pages/redeem/result.vue` | 黑对勾 + 信息卡片 + 双按钮 |
| 🔵 前端 | 5.5 | 兑换结果页 — 失败态 | 同上 | 红叉 + 三种原因 + 双按钮 |
| 🔵 前端 | 5.6 | 注册新路由 | `frontend/src/pages.json` | 添加 premium/redeem/result 页面 |
| 🟢 后端 | 5.7 | 单元测试 — Service 层 | `backend/src/test/.../service/` | UserService / MaterialService / RedeemCodeService 单元测试 |
| 🟢 后端 | 5.8 | 单元测试 — Controller 层 | `backend/src/test/.../controller/` | 各 Controller API 集成测试 |
| 🟢 后端 | 5.9 | SQL 迁移 — 测试数据 | `backend/.../db/` | 测试用种子数据（示例素材/兑换码） |

**验证**：
- 🔵 会员中心未开通/已开通切换正确；兑换码输入→格式化→校验→提交→成功/失败结果页
- 🟢 `mvn test` 全部通过

---

### Phase 6：工具页后端对接（可选，依赖 Phase 3 后端 API）

**目标**：前端工具页从后端 API 获取数据（替代静态数据）

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 6.1 | 工具 API 接入 | `frontend/src/api/tools.js` + `stores/tools.js` | tools store 改为从后端 API 获取/同步数据 |
| 🔵 前端 | 6.2 | 前后端联调 | 工具页 | 自定义工具增删改同步到后端 |
| 🟢 后端 | 6.3 | 管理员基础接口 | `backend/.../controller/AdminController.java` | 素材管理/用户管理 CUD 基础端点 |

**验证**：前端工具页数据来源于后端 API，自定义工具持久化到数据库

---

### Phase 7：收尾与优化（可并行）

**目标**：清理、综合测试、审核合规

| 轨 | # | 任务 | 文件 | 说明 |
|----|---|------|------|------|
| 🔵 前端 | 7.1 | 清理旧组件 | — | 删除 `RedeemModal.vue`（已由 BottomSheet 取代） |
| 🔵 前端 | 7.2 | 静态资源补齐 | `frontend/src/static/` | 图标/默认头像/空状态图等 |
| 🔵 前端 | 7.3 | Android 真机兼容测试 | — | backdrop-filter 回退、渐变渲染、动画性能 |
| 🔵 前端 | 7.4 | 小程序审核合规 | — | 零价格敏感词、无支付行为 |
| 🟢 后端 | 7.5 | SQL 迁移最终版 | `backend/.../db/` | 整理全部迁移脚本，确保按序执行 |
| 🟢 后端 | 7.6 | 端到端联调 | 前后端 | 全流程回归测试 |

**验证**：全功能回归测试通过，Android/iOS 真机表现正常

---

## Phase 依赖关系图

```
Phase 0 ───────────────────────────────── (基础层，无依赖)
   │
   ├──→ Phase 1 (首页) ─── 依赖 Phase 0 的前端组件
   ├──→ Phase 3 (工具页) ─ 依赖 Phase 0 的前端组件
   └──→ Phase 4 (个人中心) ─ 依赖 Phase 0 + 后端 Phase 4.6-4.10
            │
            └──→ Phase 2 (详情页) ─ 依赖 Phase 0 + Phase 1
                        │
                        └──→ Phase 5 (新页面) ─ 依赖 Phase 0 + Phase 2 (Unlock弹窗跳转)
                                    │
                                    └──→ Phase 6 (工具对接) ─ 依赖 Phase 3 + Phase 5
                                                │
                                                └──→ Phase 7 (收尾) ─ 依赖全部
```

**并行开发策略**：
- Phase 1（首页）和 Phase 3（工具页）可以并行开发——它们都只依赖 Phase 0
- Phase 4（个人中心）的后端收藏模块和前端可以并行
- Phase 5（新页面）的前后端可以独立推进（后端主要是测试）

---

## 核心技术要点

### uni-app 微信小程序限制与应对

| 限制 | 应对方案 |
|------|---------|
| 原生 TabBar 不支持 backdrop-filter | 自定义 TabBar 组件 |
| 原生导航栏不支持毛玻璃 | `navigationStyle: "custom"` + GlassNavBar |
| Android X5 内核 backdrop-filter 不完整 | `@supports` 渐进增强，fallback rgba() |
| 不支持 `navigator.clipboard` | 使用 `uni.setClipboardData` |

### 统一样式变量（uni.scss）

```scss
// 背景渐变
$bg-gradient-start: #fef5f8;
$bg-gradient-mid: #f5fdf5;
$bg-gradient-end: #fff8f0;
// 星星
$star-pink: #E8C4D4;
$star-green: #C8E6C9;
// 毛玻璃
$glass-navbar: rgba(255,255,255,0.7);
$glass-tabbar: rgba(255,255,255,0.6);
$glass-card: rgba(255,255,255,0.9);
// 边框
$border-card: #EEEEEE;
$border-input: #F7F7F7;
```

---

## 完整文件变更清单

### 新建文件（前端 10 个）
| 文件 | 所属 Phase |
|------|-----------|
| `frontend/src/components/GlassNavBar.vue` | 0 |
| `frontend/src/components/CustomTabBar.vue` | 0 |
| `frontend/src/components/BottomSheet.vue` | 0 |
| `frontend/src/components/CustomToast.vue` | 0 |
| `frontend/src/components/ToolCard.vue` | 3 |
| `frontend/src/components/IconPicker.vue` | 3 |
| `frontend/src/stores/tools.js` | 3 |
| `frontend/src/pages/premium/index.vue` | 5 |
| `frontend/src/pages/redeem/index.vue` | 5 |
| `frontend/src/pages/redeem/result.vue` | 5 |

### 新建文件（后端 9 个）
| 文件 | 所属 Phase |
|------|-----------|
| `backend/src/main/resources/db/V1__init.sql` | 0 |
| `backend/src/main/java/.../entity/Favorite.java` | 4 |
| `backend/src/main/java/.../mapper/FavoriteMapper.java` | 4 |
| `backend/src/main/java/.../service/FavoriteService.java` | 4 |
| `backend/src/main/java/.../service/impl/FavoriteServiceImpl.java` | 4 |
| `backend/src/main/java/.../controller/FavoriteController.java` | 4 |
| `backend/src/main/java/.../entity/Tool.java` | 3 |
| `backend/src/main/java/.../controller/ToolController.java` | 3 |
| `backend/src/main/java/.../service/ToolService.java` + impl | 3 |

### 修改文件
| 文件 | 所属 Phase |
|------|-----------|
| `frontend/src/uni.scss` | 0 |
| `frontend/src/App.vue` | 0 |
| `frontend/src/pages.json` | 0, 5 |
| `frontend/src/pages/index/index.vue` | 1 |
| `frontend/src/components/MaterialCard.vue` | 1 |
| `frontend/src/pages/detail/detail.vue` | 2 |
| `frontend/src/pages/tools/tools.vue` | 3 |
| `frontend/src/pages/profile/profile.vue` | 4 |
| `backend/.../MaterialController.java` | 0（分页默认值） |
| `backend/.../MaterialServiceImpl.java` | 1（分类排序+搜索增强） |
| `backend/.../DownloadServiceImpl.java` | 2（错误信息） |
| `backend/.../DownloadController.java` | 2（返回加强） |
| `backend/.../UserServiceImpl.java` | 4（收藏数接入） |

### 删除文件
| 文件 | 理由 | 所属 Phase |
|------|------|-----------|
| `frontend/src/components/RedeemModal.vue` | 被 BottomSheet 取代 | 7 |
