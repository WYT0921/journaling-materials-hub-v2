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
| tags | JSON | NULL | 标签数组 |
| is_premium | BOOLEAN | DEFAULT FALSE | 是否为会员素材 |
| download_count | INT | DEFAULT 0 | 下载次数 |
| status | TINYINT | DEFAULT 1 | 状态：0-下架，1-正常 |
| sort_order | INT | DEFAULT 0 | 排序权重 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

**索引:**
- `idx_materials_category` - category
- `idx_materials_is_premium` - is_premium
- `idx_materials_status` - status
- `idx_materials_sort_order` - sort_order

### 3. 兑换码表 (redeem_codes)

存储会员兑换码信息。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 兑换码ID |
| code | VARCHAR(32) | UNIQUE, NOT NULL | 兑换码 |
| type | VARCHAR(16) | NOT NULL | 会员类型：monthly/yearly/permanent |
| status | TINYINT | DEFAULT 0 | 状态：0-未使用，1-已使用 |
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
