# API 文档

## 微信公众号消息能力验证

> 仅支持明文回调，详细联调方式见 `docs/微信公众号消息能力验证.md`。

- `GET /api/wechat/official/callback`：微信服务器URL验证，无JWT，校验微信签名。
- `POST /api/wechat/official/callback`：接收明文XML，无JWT，校验签名并快速返回 `success`。
- `GET /api/v2/admin/wechat-probe/messages?page=1&limit=20`：管理员分页查询验证记录。
- `GET /api/v2/admin/wechat-probe/messages/{id}`：管理员查询脱敏详情。
- `POST /api/v2/admin/wechat-probe/simulate`：仅dev Profile的管理员XML模拟入口。

## 基础信息

- 基础URL: `https://your-domain.com/api`
- 请求格式: `application/json`
- 响应格式: `application/json`

## 认证方式

大部分接口需要JWT认证，在请求头中添加：

```
Authorization: Bearer <token>
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "message": "错误信息",
    "statusCode": 400,
    "timestamp": "2026-06-09T12:00:00.000Z"
  }
}
```

---

## 用户接口

### 1. 用户登录

**请求**

```
POST /api/user/login
```

**请求体**

```json
{
  "code": "微信登录code"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "userInfo": {
      "id": 1,
      "nickname": "用户昵称",
      "avatarUrl": "头像URL",
      "memberType": "normal",
      "memberExpireTime": null,
      "points": 0,
      "downloadCount": 0
    },
    "isPremium": false
  }
}
```

### 2. 获取用户信息

**请求**

```
GET /api/user/profile
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "avatarUrl": "头像URL",
    "phone": "手机号",
    "memberType": "normal",
    "memberExpireTime": null,
    "points": 100,
    "downloadCount": 15
  }
}
```

### 3. 更新用户信息

**请求**

```
PUT /api/user/profile
```

**请求体**

```json
{
  "nickname": "新昵称",
  "avatarUrl": "新头像URL",
  "phone": "新手机号"
}
```

### 4. 上传用户头像

**请求**

```
POST /api/user/avatar
Content-Type: multipart/form-data
```

**表单字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 微信 chooseAvatar 返回的头像图片文件 |

**响应**

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://example.com/materials/users/avatar/1/abc123.png"
  }
}
```

上传成功后，再调用 `PUT /api/user/profile` 保存 `nickname` 和 `avatarUrl`。

### 5. 获取会员状态

**请求**

```
GET /api/user/premium-status
```

**响应**

```json
{
  "success": true,
  "data": {
    "isPremium": true,
    "memberType": "yearly",
    "memberExpireTime": "2027-06-09T00:00:00.000Z",
    "memberTypeText": "年度会员"
  }
}
```

### 6. 获取用户统计信息

**请求**

```
GET /api/user/stats
```

**响应**

```json
{
  "success": true,
  "data": {
    "points": 120,
    "downloadCount": 15,
    "collectionCount": 8
  }
}
```

---

## 反馈接口

### 1. 提交反馈建议

允许匿名提交；如果请求头携带有效 JWT，会自动记录当前用户 ID。

**请求**

```
POST /api/feedback
```

**请求体**

```json
{
  "content": "反馈文本，最多 1000 字"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "content": "反馈文本",
    "status": 0
  }
}
```

---

## 素材接口

### 1. 获取素材列表

**请求**

```
GET /api/materials
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |
| materialType | string | 否 | 一级类型筛选：`single` 单个素材 / `bundle` 合并素材 |
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 搜索关键词 |
| sortBy | string | 否 | `default` 综合排序、`newest` 最新发布、`downloads` 最多下载 |
| issueYear | number | 否 | 上传年份；必须与 `issueNumber` 同时提供 |
| issueNumber | number | 否 | 上传期号；必须与 `issueYear` 同时提供且大于 0 |

**响应**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "data": [
      {
        "id": 1,
        "title": "治愈系猫咪贴纸",
        "description": "可爱的猫咪手账贴纸",
        "imageUrl": "图片URL",
        "thumbnailUrl": "缩略图URL",
        "category": "治愈系",
        "materialType": "single",
        "issueYear": 2026,
        "issueNumber": 7,
        "tags": ["猫咪", "贴纸", "可爱"],
        "isPremium": false,
        "downloadCount": 156,
        "isBlurred": false
      }
    ]
  }
}
```

### 2. 获取素材详情

**请求**

```
GET /api/materials/:id
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "治愈系猫咪贴纸",
    "description": "可爱的猫咪手账贴纸，适合日常记录",
    "imageUrl": "图片URL",
    "thumbnailUrl": "缩略图URL",
    "category": "治愈系",
    "materialType": "single",
    "issueYear": 2026,
    "issueNumber": 7,
    "tags": ["猫咪", "贴纸", "可爱"],
    "isPremium": false,
    "downloadCount": 156,
    "isBlurred": false,
    "createdAt": "2026-06-09T12:00:00.000Z",
    "updatedAt": "2026-06-09T12:00:00.000Z"
  }
}
```

### 3. 搜索素材

**请求**

```
GET /api/materials/search
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

### 4. 获取素材分类

**请求**

```
GET /api/materials/categories
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| materialType | string | 否 | 一级类型筛选：`single` 单个素材 / `bundle` 合并素材；只影响 `count` 统计 |

分类列表以 `categories` 表中启用的 `material` 分类为准，按 `sortOrder` 排序；`count` 为该分类下符合 `materialType` 的上架素材数量，无素材时返回 `0`。

**响应**

```json
{
  "success": true,
  "data": [
    {
      "category": "治愈系",
      "name": "治愈系",
      "count": 25
    },
    {
      "category": "极简风",
      "name": "极简风",
      "count": 18
    }
  ]
}
```

### 5. 获取上传期数

```
GET /api/materials/issues
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| materialType | string | 否 | `single` 或 `bundle`；仅返回该类型上架素材实际存在的期数 |

结果按年份、期号倒序排列；无完整期数的素材不参与统计。

```json
{
  "success": true,
  "data": [
    { "issueYear": 2026, "issueNumber": 7, "label": "2026年第七期", "count": 42 }
  ]
}
```

---

## 兑换码接口

### 1. 验证兑换码

**请求**

```
POST /api/redeem/verify
```

**请求体**

```json
{
  "code": "JM-X8K4-PQ2N"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "type": "monthly",
    "message": "兑换码有效"
  }
}
```

### 2. 激活会员

**请求**

```
POST /api/redeem/activate
```

**请求体**

```json
{
  "code": "JM-X8K4-PQ2N"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "userInfo": {
      "id": 1,
      "nickname": "用户昵称",
      "avatarUrl": "头像URL",
      "memberType": "monthly",
      "memberExpireTime": "2026-07-09T12:00:00.000Z",
      "points": 100,
      "downloadCount": 15
    },
    "isPremium": true,
    "expireTime": "2026-07-09T12:00:00.000Z",
    "message": "会员激活成功"
  }
}
```

---

## 下载接口

### 1. 下载素材

**请求**

```
GET /api/download/:materialId
```

**权限规则**

- 普通用户可免费下载 5 个不同素材，重复下载同一素材不重复扣减额度。
- 普通用户保存超过 5 个不同素材后返回 `4004`，需要输入通行码开启素材权限后继续使用。
- 会员用户不受免费次数限制。

**响应**

```json
{
  "success": true,
  "data": {
    "url": "下载链接",
    "filename": "素材标题.png",
    "message": "下载成功",
    "freeDownloadLimit": 5,
    "freeDownloadUsed": 3,
    "freeDownloadRemaining": 2
  }
}
```

### 2. 获取下载记录

**请求**

```
GET /api/download/records
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

**响应**

```json
{
  "success": true,
  "data": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "data": [
      {
        "id": 1,
        "userId": 1,
        "materialId": 1,
        "downloadedAt": "2026-06-09T12:00:00.000Z",
        "material": {
          "id": 1,
          "title": "治愈系猫咪贴纸",
          "thumbnailUrl": "缩略图URL",
          "category": "治愈系"
        }
      }
    ]
  }
}
```

---

## 管理后台接口

所有管理接口需要 admin JWT（通过 `POST /api/v2/admin/auth/login` 获取）或管理员白名单用户 ID。

### 1. 管理员登录

**请求**

```
POST /api/v2/admin/auth/login
```

**请求体**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "token": "admin_jwt_token",
    "username": "admin"
  }
}
```

### 2. 分类管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/categories?type=material` | 分类列表（按类型筛选） |
| GET | `/api/v2/admin/categories/active?type=material` | 启用分类（表单下拉用） |
| POST | `/api/v2/admin/categories` | 新增分类 `{name, type, status, sortOrder}` |
| PUT | `/api/v2/admin/categories/:id` | 编辑分类 |
| DELETE | `/api/v2/admin/categories/:id` | 删除分类 |

### 3. 素材管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/materials` | 素材列表（含已下架，支持 materialType/category/keyword/status 筛选） |
| POST | `/api/v2/admin/materials` | 新增素材（支持 `materialType`，默认 `single`） |
| PUT | `/api/v2/admin/materials/:id` | 编辑素材（支持修改 `materialType`） |
| PUT | `/api/v2/admin/materials/:id/status?status=0` | 上下架 |
| DELETE | `/api/v2/admin/materials/:id` | 删除素材 |
| POST | `/api/v2/admin/upload` | 上传图片（返回 imageUrl + thumbnailUrl） |

### 4. 颜文字 / Emoji 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/text-assets` | 列表，支持 type/category/keyword/status/source/riskLevel 筛选 |
| POST | `/api/v2/admin/text-assets` | 新增文本素材 |
| PUT | `/api/v2/admin/text-assets/:id` | 编辑文本素材 |
| PUT | `/api/v2/admin/text-assets/:id/status?status=1` | 审核或上下架 |
| PUT | `/api/v2/admin/text-assets/batch-status` | 批量审核 `{ids, status}`，最多 500 条 |
| POST | `/api/v2/admin/text-assets/import` | 批量导入 `{items}`，最多 500 条且强制进入待审核 |
| DELETE | `/api/v2/admin/text-assets/:id` | 删除文本素材 |

旧 `/api/v2/tools` 与 `/api/v2/admin/tools` 已停用，`tools` 表暂时保留用于回滚。

### 5. 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/users` | 用户列表（支持 keyword/status/memberType 筛选） |
| PUT | `/api/v2/admin/users/:id/status?status=0` | 启用/禁用 |
| PUT | `/api/v2/admin/users/:id/member` | 调整会员 `{memberType, memberExpireTime}` |

### 6. 反馈管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/feedbacks` | 反馈列表（支持 status 筛选，返回 userNicknames） |
| PUT | `/api/v2/admin/feedbacks/:id/status?status=1` | 标记已处理/未处理 |
| DELETE | `/api/v2/admin/feedbacks/:id` | 删除反馈 |

### 7. 兑换码管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/redeem-codes` | 兑换码列表（支持 status/type/keyword 筛选） |
| POST | `/api/v2/admin/redeem-codes/generate` | 批量生成一次性兑换码 `{type, count, expireTime}`，count 范围 1-500 |
| PUT | `/api/v2/admin/redeem-codes/:id/disable` | 作废未使用兑换码 |

兑换码状态：`0` 未使用，`1` 已使用，`2` 已作废。每个兑换码只能成功激活一次。

### 8. AURA 模板与资源管理

需要管理员 JWT。模板稳定键和资源稳定键全局唯一；状态 `0` 为下架、`1` 为上架。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/aura/templates` | 查看全部模板（含下架） |
| POST | `/api/v2/admin/aura/templates` | 新增模板并校验比例、图层和归一化坐标 |
| PUT | `/api/v2/admin/aura/templates/:id` | 编辑模板 |
| PUT | `/api/v2/admin/aura/templates/:id/status?status=1` | 上下架模板 |
| DELETE | `/api/v2/admin/aura/templates/:id` | 删除模板 |
| GET | `/api/v2/admin/aura/assets?type=font` | 查看全部资源，可按类型筛选 |
| POST | `/api/v2/admin/aura/assets/upload` | 上传不超过 10MB 的 PNG/JPG/WebP/TTF/OTF，返回 URL 与 SHA-256 |
| POST | `/api/v2/admin/aura/assets` | 新增资源记录 |
| PUT | `/api/v2/admin/aura/assets/:id` | 编辑资源记录 |
| PUT | `/api/v2/admin/aura/assets/:id/status?status=1` | 上下架资源 |
| DELETE | `/api/v2/admin/aura/assets/:id` | 删除资源记录 |

模板 `config` 顶层只接受 `layers`，图层类型只接受 `background/photo/player/text/decoration/texture`，不允许远程可执行代码。资源类型只接受 `decoration/texture/font`；上传端同时校验扩展 MIME 与文件魔数。

---

## AURA Music Card 公共目录

无需登录，仅返回已上架模板与资源，不包含数据库 ID、管理状态或内部存储凭证。客户端应保存响应中的 `ETag`，再次请求时通过 `If-None-Match` 发送；目录未变化时返回 `304 Not Modified`。

```http
GET /api/v2/aura/catalog
```

```json
{
  "success": true,
  "data": {
    "schemaVersion": 1,
    "catalogVersion": "8d9c...",
    "generatedAt": "2026-08-11T00:00:00",
    "templates": [
      {
        "key": "fresh-rounded",
        "name": "清新圆角",
        "style": "fresh",
        "previewUrl": null,
        "supportedRatios": ["1:1", "4:3", "9:16"],
        "configVersion": 1,
        "config": { "layers": [] }
      }
    ],
    "assets": [
      {
        "key": "font-example",
        "name": "示例字体",
        "type": "font",
        "fileUrl": "https://cdn.example.com/aura/font.ttf",
        "previewUrl": null,
        "resourceVersion": 1,
        "sha256": "64位小写十六进制摘要",
        "metadata": { "family": "AuraExample", "styleKey": "serif" }
      }
    ]
  }
}
```

客户端网络失败时使用最后一次有效目录；首次离线时使用 App 内置的 5 个基础模板。

---

## 公共分类接口

### 获取启用分类

**请求**

```
GET /api/v2/categories?type=tool
```

**响应**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "写作与项目", "type": "tool", "status": 1, "sortOrder": 1 }
  ]
}
```

## 颜文字 / Emoji 公共接口

无需登录。`type` 必须为 `kaomoji` 或 `emoji`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/text-assets?type=kaomoji&category=可爱&keyword=&page=1&limit=30` | 已发布内容分页列表，limit 最大 100 |
| GET | `/api/text-assets/categories?type=emoji` | 启用分类及已发布数量 |

列表只返回 `id/content/type/category/tags`。状态：`0` 待审核、`1` 已发布、`2` 已拒绝、`3` 已停用；风险等级为 `safe` 或 `mild`。

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/认证失败 |
| 403 | 禁止访问（需要会员权限） |
| 404 | 资源不存在 |
| 4004 | 免费保存次数已用完，需要输入通行码 |
| 409 | 数据冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. 所有时间字段均为ISO 8601格式
2. 图片URL需要支持HTTPS访问
3. 分页参数从1开始
4. 搜索关键词会进行模糊匹配
5. 普通用户可预览原图；前 5 个不同素材可免费保存，超过后需输入通行码开启素材权限
