# 数据库设计文档

## 数据库概述

- 数据库类型: MySQL 8.0+
- 字符集: utf8mb4
- 排序规则: utf8mb4_unicode_ci
- 存储引擎: InnoDB

## 数据表设计

### 1. 用户表 (users)

存储用户信息和会员状态。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户ID |
| openid | VARCHAR(64) | UNIQUE, NOT NULL | 微信openid |
| nickname | VARCHAR(64) | NULL | 用户昵称 |
| avatar_url | VARCHAR(256) | NULL | 用户头像URL |
| phone | VARCHAR(20) | NULL | 手机号 |
| member_type | ENUM | DEFAULT 'normal' | 会员类型：normal/monthly/yearly/permanent |
| member_expire_time | DATETIME | NULL | 会员到期时间 |
| points | INT | DEFAULT 0 | 积分 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| status | TINYINT | DEFAULT 1 | 状态：0-禁用，1-正常 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:**
- `idx_users_openid` (唯一索引) - openid
- `idx_users_member_type` - member_type
- `idx_users_status` - status

### 2. 素材表 (materials)

存储手账素材信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 素材ID |
| title | VARCHAR(128) | NOT NULL | 素材标题 |
| description | TEXT | NULL | 素材描述 |
| image_url | VARCHAR(256) | NOT NULL | 原图URL |
| thumbnail_url | VARCHAR(256) | NULL | 缩略图URL |
| category | VARCHAR(32) | NULL | 分类 |
| material_type | VARCHAR(16) | DEFAULT 'single' | 一级类型：single=单个素材，bundle=合并素材 |
| issue_year | INT | NULL | 上传年份，与 issue_number 同时为空或同时有值 |
| issue_number | INT | NULL | 上传期号，必须大于 0 |
| tags | JSON | NULL | 标签数组 |
| is_premium | BOOLEAN | DEFAULT FALSE | 是否为会员素材 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| status | TINYINT | DEFAULT 1 | 状态：0-下架，1-正常 |
| sort_order | INT | DEFAULT 0 | 排序权重 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:**
- `idx_materials_category` - category
- `idx_materials_material_type` - material_type
- `idx_materials_issue` - issue_year, issue_number
- `idx_materials_is_premium` - is_premium
- `idx_materials_status` - status
- `idx_materials_sort_order` - sort_order

**检查约束:** `chk_materials_issue_pair` 保证期数两字段同时为空，或年份为四位数且期号大于 0。

### 3. 兑换码表 (redeem_codes)

存储会员兑换码信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 兑换码ID |
| code | VARCHAR(32) | UNIQUE, NOT NULL | 兑换码 |
| type | VARCHAR(16) | NOT NULL | 会员类型：monthly/yearly/permanent |
| status | TINYINT | DEFAULT 0 | 状态：0-未使用，1-已使用，2-已作废 |
| user_id | BIGINT | NULL, FOREIGN KEY | 使用者ID |
| used_time | DATETIME | NULL | 使用时间 |
| expire_time | DATETIME | NULL | 到期时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:**
- `idx_redeem_codes_code` (唯一索引) - code
- `idx_redeem_codes_status` - status
- `idx_redeem_codes_user_id` - user_id

**外键:**
- `user_id` -> `users.id` (ON DELETE SET NULL)

### 4. 下载记录表 (downloads)

存储用户下载素材的记录。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 下载记录ID |
| user_id | BIGINT | NOT NULL, FOREIGN KEY | 用户ID |
| material_id | BIGINT | NOT NULL, FOREIGN KEY | 素材ID |
| downloaded_at | DATETIME | NOT NULL | 下载时间 |

**索引:**
- `idx_downloads_user_id` - user_id
- `idx_downloads_material_id` - material_id
- `idx_downloads_downloaded_at` - downloaded_at
- `idx_downloads_user_material` (唯一索引) - user_id, material_id

**外键:**
- `user_id` -> `users.id` (ON DELETE CASCADE)
- `material_id` -> `materials.id` (ON DELETE CASCADE)

### 5. 反馈建议表 (feedbacks)

存储用户提交的反馈建议，支持匿名反馈。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 反馈ID |
| user_id | BIGINT | NULL, FOREIGN KEY | 用户ID，匿名反馈为空 |
| content | TEXT | NOT NULL | 反馈内容 |
| status | TINYINT | DEFAULT 0 | 处理状态：0-未处理，1-已处理 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:**
- `idx_feedbacks_user_id` - user_id
- `idx_feedbacks_status` - status
- `idx_feedbacks_created_at` - created_at

**外键:**
- `user_id` -> `users.id` (ON DELETE SET NULL)

### 6. 分类表 (categories)

存储图片素材、颜文字、Emoji 和遗留工具的分类信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 分类ID |
| name | VARCHAR(32) | NOT NULL | 分类名称 |
| type | VARCHAR(16) | NOT NULL | 分类类型：material / kaomoji / emoji / tool(遗留) |
| status | TINYINT | DEFAULT 1 | 状态：0-禁用，1-正常 |
| sort_order | INT | DEFAULT 0 | 排序序号 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:**
- `uk_categories_name_type` (唯一索引) - name, type
- `idx_categories_type` - type
- `idx_categories_status` - status

### 7. 文本素材表 (text_assets)

存储经过审核的颜文字和 Emoji 组合。采集器只生成候选 JSON，导入后默认处于待审核状态。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 文本素材 ID |
| content | TEXT | NOT NULL | 规范化后的可复制内容 |
| content_hash | CHAR(64) | UNIQUE, NOT NULL | 内容 SHA-256，用于幂等去重 |
| type | VARCHAR(16) | NOT NULL | kaomoji / emoji |
| category | VARCHAR(32) | NOT NULL | 对应类型下的启用分类 |
| tags | JSON | NULL | 搜索标签数组 |
| source | VARCHAR(32) | DEFAULT manual | manual / cuteinternet / emojidb |
| source_url | VARCHAR(512) | NULL | 来源页面 |
| risk_level | VARCHAR(16) | DEFAULT safe | safe / mild |
| status | TINYINT | DEFAULT 0 | 0待审核、1已发布、2已拒绝、3已停用 |
| sort_order | INT | DEFAULT 0 | 排序权重 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:** `uk_text_assets_content_hash` 保证内容全局唯一；`idx_text_assets_public` 支持类型、状态、分类和排序查询。

### 8. AURA 模板表 (aura_templates)

存储 AURA Music Card 的声明式模板配置，与现有 `materials` 表完全独立。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 内部 ID，不在公共目录暴露 |
| template_key | VARCHAR(64) | UNIQUE, NOT NULL | 客户端稳定键 |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| style | VARCHAR(32) | NOT NULL | 风格筛选键 |
| preview_url | VARCHAR(512) | NULL | 预览图 URL |
| supported_ratios | JSON | NOT NULL | 仅允许 1:1、4:3、9:16 |
| config_json | JSON | NOT NULL | 版本化声明式图层配置 |
| config_version | INT | DEFAULT 1 | 配置版本 |
| status | TINYINT | DEFAULT 0 | 0下架、1上架 |
| sort_order | INT | DEFAULT 0 | 展示顺序 |
| created_at / updated_at | DATETIME | NOT NULL | 创建和更新时间 |

**索引:** `uk_aura_templates_key` 保证稳定键唯一；`idx_aura_templates_public` 支持公开目录的状态与排序查询。

### 9. AURA 资源表 (aura_assets)

存储装饰、纹理和字体的远程分发元数据，不存储用户照片、作品或草稿。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 内部 ID |
| asset_key | VARCHAR(64) | UNIQUE, NOT NULL | 客户端稳定键 |
| name | VARCHAR(100) | NOT NULL | 资源名称 |
| type | VARCHAR(16) | NOT NULL | decoration / texture / font |
| file_url | VARCHAR(512) | NOT NULL | MinIO/CDN 文件 URL |
| preview_url | VARCHAR(512) | NULL | 预览 URL |
| sha256 | CHAR(64) | NOT NULL | 客户端完整性校验摘要 |
| resource_version | INT | DEFAULT 1 | 资源缓存版本 |
| metadata_json | JSON | NULL | 字体 family/styleKey 等扩展元数据 |
| status | TINYINT | DEFAULT 0 | 0下架、1上架 |
| sort_order | INT | DEFAULT 0 | 展示顺序 |
| created_at / updated_at | DATETIME | NOT NULL | 创建和更新时间 |

**索引:** `uk_aura_assets_key` 保证稳定键唯一；`idx_aura_assets_public` 支持状态、类型与排序查询。

两张 AURA 表之间不设外键：模板通过稳定资源键引用目录资源，便于独立版本发布与客户端缓存回退。

---

## 实体关系图

```
┌─────────────┐       ┌─────────────┐
│   users     │       │  materials  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ openid      │       │ title       │
│ nickname    │       │ description │
│ avatar_url  │       │ image_url   │
│ phone       │       │ thumbnail_url│
│ member_type │       │ category    │
│ member_expire_time  │ tags        │
│ points      │       │ is_premium  │
│ download_count      │ download_count
│ status      │       │ status      │
│ created_at  │       │ sort_order  │
│ updated_at  │       │ created_at  │
└─────────────┘       │ updated_at  │
       │              └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────────────────────────────┐
│           downloads                 │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_id (FK -> users.id)           │
│ material_id (FK -> materials.id)   │
│ downloaded_at                       │
└─────────────────────────────────────┘

┌─────────────┐
│redeem_codes │
├─────────────┤
│ id (PK)     │
│ code        │
│ type        │
│ status      │
│ user_id (FK -> users.id)
│ used_time   │
│ expire_time │
│ created_at  │
│ updated_at  │
└─────────────┘
```

---

## 数据迁移

Spring Boot 使用 `backend/src/main/resources/db/V11__create_aura_catalog.sql` 创建两张 AURA 表，并以幂等方式写入首批 5 个已上架基础模板。

### 运行迁移

```bash
# 运行所有迁移
npm run migrate

# 撤销上一次迁移
npm run migrate:undo

# 撤销所有迁移
npm run migrate:undo:all
```

### 迁移文件列表

1. `20260609-create-users.js` - 创建用户表
2. `20260609-create-materials.js` - 创建素材表
3. `20260609-create-redeem-codes.js` - 创建兑换码表
4. `20260609-create-downloads.js` - 创建下载记录表

---

## 种子数据

### 运行种子

```bash
# 插入所有种子数据
npm run seed
```

### 种子文件列表

1. `20260609-demo-materials.js` - 示例素材数据
2. `20260609-demo-redeem-codes.js` - 示例兑换码数据

---

## 数据库维护

### 备份数据库

```bash
# 备份整个数据库
mysqldump -u root -p journaling_materials_hub > backup.sql

# 备份特定表
mysqldump -u root -p journaling_materials_hub users materials > backup_tables.sql
```

### 恢复数据库

```bash
# 恢复数据库
mysql -u root -p journaling_materials_hub < backup.sql
```

### 优化表

```sql
-- 优化所有表
OPTIMIZE TABLE users, materials, redeem_codes, downloads;

-- 分析表
ANALYZE TABLE users, materials, redeem_codes, downloads;
```

---

## 性能优化建议

### 1. 索引优化

- 为常用查询字段创建索引
- 避免过度索引，影响写入性能
- 定期分析慢查询日志

### 2. 查询优化

- 使用分页查询，避免一次返回大量数据
- 只查询需要的字段，避免 SELECT *
- 使用 JOIN 代替子查询

### 3. 缓存策略

- 使用 Redis 缓存热点数据
- 设置合理的缓存过期时间
- 实现缓存更新机制

### 4. 连接池配置

```javascript
// 生产环境连接池配置
pool: {
  max: 20,        // 最大连接数
  min: 5,         // 最小连接数
  acquire: 30000, // 获取连接超时时间
  idle: 10000     // 空闲连接超时时间
}
```

---

## 安全建议

### 1. 数据安全

- 敏感数据加密存储
- 定期备份数据
- 限制数据库访问权限

### 2. SQL注入防护

- 使用参数化查询
- 验证用户输入
- 使用 ORM 框架

### 3. 访问控制

- 使用强密码
- 限制远程访问
- 启用审计日志

---

## 常见问题

### 1. 如何添加新字段？

1. 创建新的迁移文件
2. 定义字段变更
3. 运行迁移

### 2. 如何修改字段类型？

1. 创建迁移文件
2. 使用 `changeColumn` 方法
3. 注意数据兼容性

### 3. 如何处理数据迁移？

1. 备份原始数据
2. 创建迁移脚本
3. 测试迁移脚本
4. 执行迁移
5. 验证数据
