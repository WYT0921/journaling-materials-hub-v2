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

### 4. 获取会员状态

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

### 5. 获取用户统计信息

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

**响应**

```json
{
  "success": true,
  "data": {
    "url": "下载链接",
    "filename": "素材标题.png",
    "message": "下载成功"
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

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/认证失败 |
| 403 | 禁止访问（需要会员权限） |
| 404 | 资源不存在 |
| 409 | 数据冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. 所有时间字段均为ISO 8601格式
2. 图片URL需要支持HTTPS访问
3. 分页参数从1开始
4. 搜索关键词会进行模糊匹配
5. 会员素材对非会员返回模糊图片
