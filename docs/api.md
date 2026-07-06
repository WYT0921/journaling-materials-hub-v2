# API 文档

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
| category | string | 否 | 分类筛选 |
| keyword | string | 否 | 搜索关键词 |

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

**响应**

```json
{
  "success": true,
  "data": [
    {
      "name": "治愈系",
      "count": 25
    },
    {
      "name": "极简风",
      "count": 18
    }
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
- 普通用户超过 5 次后返回 `4004`，需要通过兑换会员码激活会员后继续下载。
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
| GET | `/api/v2/admin/materials` | 素材列表（含已下架，支持 category/keyword/status 筛选） |
| POST | `/api/v2/admin/materials` | 新增素材 |
| PUT | `/api/v2/admin/materials/:id` | 编辑素材 |
| PUT | `/api/v2/admin/materials/:id/status?status=0` | 上下架 |
| DELETE | `/api/v2/admin/materials/:id` | 删除素材 |
| POST | `/api/v2/admin/upload` | 上传图片（返回 imageUrl + thumbnailUrl） |

### 4. 工具管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v2/admin/tools` | 工具列表（支持 category/status 筛选） |
| POST | `/api/v2/admin/tools` | 新增工具 |
| PUT | `/api/v2/admin/tools/:id` | 编辑工具 |
| PUT | `/api/v2/admin/tools/:id/status?status=0` | 上下架 |
| DELETE | `/api/v2/admin/tools/:id` | 删除工具 |

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

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/认证失败 |
| 403 | 禁止访问（需要会员权限） |
| 404 | 资源不存在 |
| 4004 | 免费下载次数已用完，需要兑换会员码 |
| 409 | 数据冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. 所有时间字段均为ISO 8601格式
2. 图片URL需要支持HTTPS访问
3. 分页参数从1开始
4. 搜索关键词会进行模糊匹配
5. 普通用户可预览原图；下载前 5 个不同素材免费，超过后需兑换会员码激活会员
