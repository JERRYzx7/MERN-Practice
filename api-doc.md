# SplitQuest API Documentation

> **Base URL:** `http://localhost:3000/api`
> **Auth:** Bearer Token（JWT）—— 除 `/users/register` 和 `/users/login` 外，所有端點均需 `Authorization: Bearer <token>` header。
> **Content-Type:** `application/json`

---

## 目錄

- [System](#system)
- [Users](#users)
- [Groups](#groups)
- [Expenses](#expenses)
- [Error 格式](#error-格式)

---

## System

### `GET /health`

> 健康檢查（Playwright E2E 用）

**Auth：** 不需要

**Response `200`**
```json
{ "ok": true }
```

---

## Users

### `POST /api/users/register`

> 註冊新帳號，自動建立個人群組（Personal Group），回傳 JWT token

**Auth：** 不需要

**Request Body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

| 欄位 | 型別 | 必填 | 規則 |
|------|------|------|------|
| `name` | string | ✅ | 至少 2 個字 |
| `email` | string | ✅ | 有效 email 格式 |
| `password` | string | ✅ | 至少 8 個字元 |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "name": "Alice",
    "email": "alice@example.com",
    "personalGroupId": "uuid-v4",
    "token": "eyJhbGci..."
  }
}
```

**Errors**
| Status | 原因 |
|--------|------|
| `400` | 欄位驗證失敗（含 `details` 欄位） |
| `409` | Email 已被使用 |
| `422` | Domain 建立失敗 |

---

### `POST /api/users/login`

> 帳密登入，回傳 JWT token

**Auth：** 不需要

**Request Body**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

| 欄位 | 型別 | 必填 |
|------|------|------|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "name": "Alice",
    "email": "alice@example.com",
    "personalGroupId": "uuid-v4",
    "token": "eyJhbGci..."
  }
}
```

**Errors**
| Status | 原因 |
|--------|------|
| `400` | 欄位驗證失敗 |
| `401` | Email 或密碼錯誤 |

---

## Groups

> ⚠️ 以下所有端點需要 `Authorization: Bearer <token>`

### `GET /api/groups`

> 取得當前登入用戶所屬的所有群組（含 Personal 和 Team）

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4",
      "name": "我的帳本",
      "type": "Personal",
      "ownerId": "uuid-v4",
      "memberIds": ["uuid-v4"]
    },
    {
      "id": "uuid-v4-2",
      "name": "東京旅遊",
      "type": "Team",
      "ownerId": "uuid-v4",
      "memberIds": ["uuid-v4", "uuid-v4-3"]
    }
  ]
}
```

---

### `POST /api/groups`

> 建立新群組（Team 類型）

**Request Body**
```json
{
  "name": "東京旅遊",
  "ownerId": "uuid-v4",
  "memberIds": ["uuid-v4", "uuid-v4-2"]
}
```

| 欄位 | 型別 | 必填 | 規則 |
|------|------|------|------|
| `name` | string | ✅ | 至少 1 個字 |
| `ownerId` | string | ✅ | 群組擁有者的 userId |
| `memberIds` | string[] | ✅ | 至少 1 人（含 owner）|

**Response `201`**
```json
{
  "success": true,
  "data": { "id": "uuid-v4" }
}
```

**Errors**
| Status | 原因 |
|--------|------|
| `400` | 欄位驗證失敗 |
| `401` | 未攜帶 token |
| `422` | Domain 建立失敗 |

---

### `POST /api/groups/:groupId/members`

> 新增成員到群組

**Path Params**
| 參數 | 說明 |
|------|------|
| `groupId` | 群組 ID |

**Request Body**
```json
{ "userId": "uuid-v4" }
```

**Response `200`**
```json
{ "success": true }
```

**Errors**
| Status | 原因 |
|--------|------|
| `400` | 欄位驗證失敗 |
| `401` | 未攜帶 token |
| `404` | 群組不存在 |
| `422` | 成員已在群組中 |

---

### `GET /api/groups/:groupId/expenses`

> 取得某群組的所有支出記錄

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4",
      "groupId": "uuid-group",
      "payerId": "uuid-payer",
      "amount": 300,
      "currency": "TWD",
      "description": "晚餐",
      "splits": [
        { "userId": "uuid-v4", "amount": 150 },
        { "userId": "uuid-v4-2", "amount": 150 }
      ]
    }
  ]
}
```

---

### `GET /api/groups/:groupId/balance`

> 取得群組的結餘計算結果（最少轉帳次數結算）

**Path Params**
| 參數 | 說明 |
|------|------|
| `groupId` | 群組 ID |

**Response `200`**
```json
{
  "success": true,
  "data": {
    "netBalances": {
      "user-id-1": 150.00,
      "user-id-2": -150.00
    },
    "settlements": [
      { "from": "user-id-2", "to": "user-id-1", "amount": 150.00 }
    ],
    "descriptions": [
      "user-id-2 需要支付 user-id-1 $150.00"
    ]
  }
}
```

> `netBalances` 正值 = 別人欠你；負值 = 你欠別人

**Errors**
| Status | 原因 |
|--------|------|
| `401` | 未攜帶 token |
| `404` | 群組不存在 |

---

## Expenses

> ⚠️ 以下所有端點需要 `Authorization: Bearer <token>`

### `POST /api/expenses`

> 建立一筆支出，支援三種分帳模式

**Request Body（EQUAL）**
```json
{
  "description": "午餐",
  "totalAmount": 300,
  "currency": "TWD",
  "payerId": "uuid-v4",
  "groupId": "uuid-v4",
  "splitType": "EQUAL",
  "memberIds": ["uuid-v4", "uuid-v4-2"]
}
```

**Request Body（PERCENTAGE）**
```json
{
  "description": "晚餐",
  "totalAmount": 1000,
  "currency": "TWD",
  "payerId": "uuid-v4",
  "groupId": "uuid-v4",
  "splitType": "PERCENTAGE",
  "percentageMap": {
    "uuid-v4": 60,
    "uuid-v4-2": 40
  }
}
```

**Request Body（EXACT）**
```json
{
  "description": "計程車",
  "totalAmount": 500,
  "currency": "TWD",
  "payerId": "uuid-v4",
  "groupId": "uuid-v4",
  "splitType": "EXACT",
  "exactMap": {
    "uuid-v4": 300,
    "uuid-v4-2": 200
  }
}
```

**共用欄位**

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `description` | string | ✅ | 費用說明，不能為空 |
| `totalAmount` | number | ✅ | 總金額，必須大於 0 |
| `currency` | string | ❌ | 幣別，預設 `"TWD"` |
| `payerId` | string | ✅ | 付款人 userId |
| `groupId` | string | ✅ | 所屬群組 |
| `splitType` | `"EQUAL"` \| `"PERCENTAGE"` \| `"EXACT"` | ✅ | 分帳模式 |
| `memberIds` | string[] | EQUAL 必填 | 等額分帳成員清單 |
| `percentageMap` | `Record<string, number>` | PERCENTAGE 必填 | 各成員百分比（總和須為 100）|
| `exactMap` | `Record<string, number>` | EXACT 必填 | 各成員指定金額（總和須等於 totalAmount）|

**Response `201`**
```json
{ "success": true }
```

**Errors**
| Status | 原因 |
|--------|------|
| `400` | 欄位驗證失敗 |
| `401` | 未攜帶 token |
| `422` | Domain 驗證失敗（付款人不在群組、百分比不等於 100 等）|

---

## Error 格式

所有錯誤均回傳以下結構：

```json
{
  "success": false,
  "error": "錯誤訊息",
  "details": { }
}
```

> `details` 僅在欄位驗證失敗（status `400`）時存在，格式為 Zod `flatten().fieldErrors`

---

## JWT Payload 格式

```json
{
  "sub": "user-uuid",
  "email": "alice@example.com",
  "iat": 1700000000,
  "exp": 1700604800
}
```

> Token 有效期：7 天（可透過 `JWT_EXPIRES_IN` env var 調整）

---

## 版本紀錄

| 版本 | 說明 |
|------|------|
| Phase 5 | 初始版本：Users、Groups、Expenses 基礎 CRUD |
| Phase 7 | 新增 JWT 認證；`POST /api/users/login`；Expense 加 `currency` 欄位；Groups/Expenses 受保護 |
