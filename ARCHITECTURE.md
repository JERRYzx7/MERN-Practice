# SplitQuest 專案架構文件

> 📝 **用途**: 此文件詳細記錄前後端所有程式檔案的功能，供 code review 和專案理解使用。

---

## 📋 目錄

- [專案概述](#專案概述)
- [技術棧](#技術棧)
- [後端架構 (Clean Architecture)](#後端架構-clean-architecture)
  - [Domain Layer (領域層)](#1-domain-layer-領域層)
  - [Application Layer (應用層)](#2-application-layer-應用層)
  - [Infrastructure Layer (基礎建設層)](#3-infrastructure-layer-基礎建設層)
  - [Interface Layer (介面層)](#4-interface-layer-介面層)
  - [Shared Layer (共用層)](#5-shared-layer-共用層)
- [前端架構](#前端架構)
- [測試架構](#測試架構)
- [配置檔案](#配置檔案)

---

## 專案概述

**SplitQuest** 是一個採用 **Clean Architecture (整潔架構)** 設計的記帳分帳系統，支援多人群組分帳、個人記帳、餘額結算計算、收入支出分類等功能。

### 核心特色
- ✅ **Clean Architecture 四層架構**：Domain → Application → Infrastructure → Interface
- ✅ **TDD 開發**: 67 單元測試覆蓋核心邏輯
- ✅ **Result Pattern**: Railway-oriented programming 取代 try-catch
- ✅ **依賴注入 (DI)**: Awilix 管理依賴
- ✅ **Repository Pattern**: 抽象資料存取層
- ✅ **Type Safety**: TypeScript strict mode + Zod runtime validation

---

## 技術棧

### 後端
- **Runtime**: Node.js (Latest)
- **Framework**: Express.js
- **Language**: TypeScript (Strict Mode)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **DI Container**: Awilix
- **Testing**: Vitest

### 前端
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand (with persist middleware)
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS (Pixel art theme)
- **Build Tool**: Vite

---

## 後端架構 (Clean Architecture)

```
┌─────────────────────────────────────────────┐
│    Interface Layer (HTTP/Express)           │
│    Controllers, Routes, Middlewares         │
└──────────────────┬──────────────────────────┘
                   │ 依賴
┌──────────────────▼──────────────────────────┐
│    Application Layer (Use Cases)            │
│    Orchestrates domain logic                │
└──────────────────┬──────────────────────────┘
                   │ 依賴
┌──────────────────▼──────────────────────────┐
│    Domain Layer (Business Logic)            │
│    Entities, Repositories, Services         │
│    NO external dependencies                 │
└─────────────────────────────────────────────┘
                   ▲
                   │ 實作
┌──────────────────┴──────────────────────────┐
│    Infrastructure Layer                     │
│    MongoDB, bcrypt, JWT, DI container       │
└─────────────────────────────────────────────┘
```

---

## 1. Domain Layer (領域層)

> 💡 **核心業務邏輯**，不依賴任何外部框架或資料庫。所有檔案路徑位於 `src/domain/`

### 1.1 實體 (Entities) — `src/domain/entities/`

| 檔案 | 功能說明 |
|------|---------|
| **User.ts** | 使用者實體：包含 name、email、authentication (OAuth/password)、個人群組關聯、自訂收支分類。驗證規則：name ≥2 字元、有效 email。方法：`create()` 工廠方法、`setPersonalGroup()`、`updateProfile()`、`updateCustomCategories()`。 |
| **User.spec.ts** | User 實體單元測試：測試建立有效使用者、email 格式錯誤、名稱太短、customCategories 預設值、updateCustomCategories 更新。 |
| **Expense.ts** | 支出實體：聚合多筆 payments (誰付錢) 和 splits (誰分攤)。計算總金額、驗證 splits 平衡 (容差 0.011)、儲存 metadata (日期、分類、類型：支出/收入)。強制所有 payments 和 splits 存在才能建立。 |
| **Expense.spec.ts** | Expense 實體單元測試：測試建立支出、支付/分攤驗證、金額計算、日期/分類/類型欄位。 |
| **Group.ts** | 群組實體：支援 PERSONAL (僅擁有者) 和 TEAM (多人) 兩種類型。業務規則：個人群組只能包含擁有者本人；團隊群組至少有一名成員。**邀請系統**：含 `InviteToken` 介面 (code, expiresAt, createdBy)、`inviteTokens` 陣列。方法：`addMember()`、`addInviteToken()` (建立 7 天有效邀請)、`acceptInvite()` (驗證邀請碼並加入成員)。 |
| **Group.spec.ts** | Group 實體單元測試：測試建立群組、個人群組驗證、團隊群組成員管理、addMember 驗證、邀請令牌建立與接受。 |
| **Payment.ts** | 值物件 (Value Object)：代表使用者對支出的付款貢獻，含 userId、amount、note。不可變結構。 |
| **Split.ts** | 值物件：代表使用者在支出中的分攤義務。包含 `adjustAmount()` 方法處理浮點數四捨五入。 |

### 1.2 Repository 介面 — `src/domain/repositories/`

| 檔案 | 功能說明 |
|------|---------|
| **IUserRepository.ts** | 使用者持久化介面：定義 `findById()`、`findByEmail()`、`save()`、`findByIds()`。不含實作細節，遵循 Repository Pattern。 |
| **IExpenseRepository.ts** | 支出持久化介面：`save()`、`findById()`、`findByGroupId()`。實現控制反轉。 |
| **IGroupRepository.ts** | 群組持久化介面：`findById()`、`findByUserId()`、`isUserInGroup()`、`save()`、`findByInviteCode()` (QR 邀請查詢)。支援群組查詢、成員檢查與邀請碼查找。 |

### 1.3 Domain Services — `src/domain/services/`

| 檔案 | 功能說明 |
|------|---------|
| **BalanceService.ts** | 核心結算邏輯：計算群組成員間結算平衡。三步驟演算法：(1) 計算淨餘額 (正=被欠、負=欠人)、(2) 貪婪債務簡化減少轉帳次數、(3) 產生人類可讀描述。容差 0.011。方法：`calculate()`、`calculateNetBalances()`、`simplifyDebts()`、`generateDescriptions()`。 |
| **BalanceService.spec.ts** | BalanceService 單元測試：測試各種分帳場景、邊界條件、簡化債務演算法正確性。 |
| **SplitService.ts** | 分攤計算邏輯：支援 3 種策略 — 等額分攤 (平分)、百分比分攤 (可配置 %)、指定金額分攤 (固定金額)。含驗證和餘數處理。方法：`validateBalance()`、`calculateEqualSplits()`、`calculatePercentageSplits()`、`calculateExactSplits()`。 |
| **SplitService.spec.ts** | SplitService 單元測試：測試各種分攤場景、驗證邏輯、邊界條件。 |

---

## 2. Application Layer (應用層)

> 💡 **Use Case 編排層**，協調 Domain 邏輯與 Repository。所有檔案路徑位於 `src/application/`

### 2.1 Use Cases — `src/application/use-cases/`

| 檔案 | 功能說明 |
|------|---------|
| **CreateExpenseUseCase.ts** | 建立支出 Use Case：驗證群組存在、確認主付款人在群組中、從 payments 計算總金額、根據 splitType (EQUAL/PERCENTAGE/EXACT) 路由至 SplitService、建立 Expense 實體、透過 repository 持久化。回傳 Result 含錯誤處理。 |
| **CreateExpenseUseCase.spec.ts** | CreateExpenseUseCase 單元測試：使用 mock repositories 測試各種分帳場景、驗證邏輯、錯誤路徑。 |
| **GetBalanceUseCase.ts** | 取得結算平衡 Use Case：驗證群組存在、取得所有支出、委託給 BalanceService.calculate() 計算結算。回傳 BalanceResult 含 netBalances、settlements、descriptions。 |
| **GetBalanceUseCase.spec.ts** | GetBalanceUseCase 單元測試：測試結算計算、多筆支出整合、錯誤處理。 |
| **GetExpensesUseCase.ts** | 取得支出列表 Use Case：取得群組所有支出並轉換成 ExpenseDTO 格式。將 domain entities 轉換為 API response DTOs (含 id、payments、amount、currency、splits、date、category、type)。 |
| **GetGroupMembersUseCase.ts** | 取得群組成員 Use Case：取得群組、依成員 IDs 載入使用者、映射成 MemberDTO (id、name、avatarUrl)。用於顯示群組名冊。 |
| **GetGroupsUseCase.ts** | 取得使用者群組 Use Case：依 userId 查詢 repository、映射成 GroupDTO。回傳使用者所屬的群組列表。 |
| **CreateInviteUseCase.ts** | 建立群組邀請 Use Case：驗證群組存在、生成 UUID 邀請碼、設定 7 天過期時間、透過 `Group.addInviteToken()` 儲存邀請令牌。回傳 inviteCode 供前端生成 QR Code。 |
| **CreateInviteUseCase.spec.ts** | CreateInviteUseCase 單元測試：測試邀請碼生成、群組不存在錯誤、過期時間計算。 |
| **JoinByInviteUseCase.ts** | 透過邀請加入群組 Use Case：使用 `findByInviteCode()` 查找群組、驗證邀請碼有效性 (未過期、存在)、透過 `Group.acceptInvite()` 加入成員。回傳 groupId 供前端跳轉。 |
| **JoinByInviteUseCase.spec.ts** | JoinByInviteUseCase 單元測試：測試成功加入、無效邀請碼、已過期、已是成員等情境。 |

### 2.2 Application Service 介面 — `src/application/services/`

| 檔案 | 功能說明 |
|------|---------|
| **IJwtService.ts** | JWT 服務介面：定義 `sign(payload)` 建立 token、`verify(token)` 驗證並解碼。由 infrastructure layer 實作。 |
| **IPasswordService.ts** | 密碼服務介面：定義 `hash(plaintext)` 和 `compare(plaintext, hash)` 操作。infrastructure 用 bcrypt 實作。 |

### 2.3 Data Transfer Objects — `src/application/dtos/`

| 檔案 | 功能說明 |
|------|---------|
| **CreateExpenseDTO.ts** | 建立支出 DTO：discriminated union 提供分攤彈性。共同欄位 (description、currency、payments、groupId、date、category、type) + discriminated union for splitType: EQUAL (memberIds)、PERCENTAGE (percentageMap)、EXACT (exactMap)。確保 type-safe 分攤方法選擇。 |

---

## 3. Infrastructure Layer (基礎建設層)

> 💡 **外部服務與資料存取實作**。所有檔案路徑位於 `src/infrastructure/`

### 3.1 Database Layer — `src/infrastructure/database/`

| 檔案 | 功能說明 |
|------|---------|
| **connection.ts** | MongoDB 連線管理：`connectDatabase(uri?)` 連接至 MongoDB (使用 env MONGODB_URI 或 localhost)、`disconnectDatabase()` 關閉連線。簡單包裝 mongoose 生命週期。 |
| **UserSchema.ts** | User Mongoose schema + model：定義 IUserDocument 介面和 UserSchema，欄位含 name、email、personalGroupId、passwordHash、avatarUrl、oauthProvider、oauthId、customCategories (expense/income 陣列)。匯出 UserModel 供查詢。 |
| **MongoUserRepository.ts** | IUserRepository 實作：從 MongoDB 持久化/取得使用者。含 `toDomain()` 映射從 MongoDB document 至 User entity。使用 lean() 提升效能，upsert pattern 儲存。 |
| **GroupSchema.ts** | Group Mongoose schema：定義 IGroupDocument，欄位含 name、type (enum)、ownerId、memberIds、**inviteTokens** (code、expiresAt、createdBy 子文件陣列)。memberIds 索引以加快查詢。匯出 GroupModel。 |
| **MongoGroupRepository.ts** | IGroupRepository 實作：處理群組 CRUD 與成員查詢。含 `toDomain()` mapper、`findByUserId()` 供群組探索、`isUserInGroup()` 供授權檢查、**`findByInviteCode()`** 透過邀請碼查找群組。 |
| **ExpenseSchema.ts** | Expense Mongoose schema：含嵌套的 PaymentSubSchema 和 SplitSubSchema。IExpenseDocument 含 payments 陣列、splits 陣列、metadata (date、category、type)。groupId 索引加快查詢。 |
| **MongoExpenseRepository.ts** | IExpenseRepository 實作：持久化/取得支出。含 `toDomain()` mapper 重建 Payment 和 Split 物件。優雅處理舊版/格式錯誤文件 (findByGroupId 時跳過)。 |

### 3.2 Application Services 實作 — `src/infrastructure/services/`

| 檔案 | 功能說明 |
|------|---------|
| **BcryptPasswordService.ts** | IPasswordService 實作：使用 bcrypt，12 salt rounds。`hash()` 加密密碼、`compare()` 驗證明文對比 hash。Production-ready 安全性。 |
| **JwtService.ts** | IJwtService 實作：使用 jsonwebtoken。建構子需要 JWT_SECRET (缺少會拋錯)。`sign()` 建立 token 可配置過期時間 (預設 7d)、`verify()` 安全驗證並解碼。驗證失敗回傳 null。 |

### 3.3 Dependency Injection — `src/infrastructure/di/`

| 檔案 | 功能說明 |
|------|---------|
| **container.ts** | IoC 容器 `buildContainer()`：實例化所有 repositories (Mongo*Repository)、services (BcryptPasswordService、JwtService)、use cases、controllers。宣告式連接依賴。回傳 AppContainer 介面含 expenseController、groupController、userController、jwtService 供 app 初始化。依賴管理中央位置。 |

---

## 4. Interface Layer (介面層)

> 💡 **HTTP 呈現層 (Express)**。所有檔案路徑位於 `src/interfaces/`

### 4.1 Controllers — `src/interfaces/controllers/`

| 檔案 | 功能說明 |
|------|---------|
| **ExpenseController.ts** | 處理支出 HTTP endpoints：`createExpense()` (POST) 用 Zod discriminated union schema 驗證，執行 CreateExpenseUseCase；`getExpenses()` (GET /:groupId/expenses) 取得並回傳 ExpenseDTO[]；`getBalance()` (GET /:groupId/balance) 計算結算平衡。所有方法含 Zod 驗證和錯誤回應。 |
| **GroupController.ts** | 處理群組 HTTP endpoints：`getGroups()` (GET) 取得使用者群組；`createGroup()` (POST) 驗證輸入、建立 Group entity、持久化；`getMembers()` (GET /:groupId/members) 取得成員列表；`addMember()` (POST /:groupId/members) 加入使用者至群組含驗證；**`createInvite()` (POST /:groupId/invites)** 建立邀請碼；**`joinByInvite()` (POST /join/:inviteCode)** 透過邀請碼加入群組。使用 Zod 驗證。 |
| **UserController.ts** | 處理使用者認證與個人資料 endpoints：`register()` (POST) 建立使用者 + 個人群組、hash 密碼、簽發 JWT；`login()` (POST) 驗證憑證、簽發 JWT；`updateMe()` (PATCH) 更新個人資料欄位、處理密碼變更含驗證。所有方法 Zod 驗證 + 自訂中文錯誤訊息。 |
| **UserController.spec.ts** | UserController 單元測試：測試 updateMe 含 customCategories、login response 含 customCategories。使用 mock repositories。 |

### 4.2 Routes — `src/interfaces/routes/`

| 檔案 | 功能說明 |
|------|---------|
| **expenseRoutes.ts** | Express router for expense endpoints：POST / → createExpense。Factory function 接收 ExpenseController。最小路由—細節在 controller。 |
| **groupRoutes.ts** | Express router for group endpoints：GET /、POST /、GET /:groupId/members、POST /:groupId/members、GET /:groupId/balance、GET /:groupId/expenses、**POST /:groupId/invites** (建立邀請)、**POST /join/:inviteCode** (加入群組)。組合 GroupController 和 ExpenseController 方法。 |
| **userRoutes.ts** | Express router for user endpoints：POST /register、POST /login、PATCH /me (protected)。條件式套用 authMiddleware 至受保護路由。 |

### 4.3 Middlewares — `src/interfaces/middlewares/`

| 檔案 | 功能說明 |
|------|---------|
| **authMiddleware.ts** | JWT 認證 middleware：從 Authorization header 提取 Bearer token、用 JwtService 驗證、提取 `sub` claim (userId)、附加至 `req.userId`。缺少/無效 token 回傳 401。擴展 Express Request 介面全域包含 userId 屬性。 |
| **errorHandler.ts** | Express 錯誤處理 middleware (4-arg function)：捕捉 AppError 含選用 statusCode、回傳 JSON 錯誤回應。statusCode 缺少預設 500。集中錯誤格式化。 |
| **validateRequest.ts** | Zod 請求驗證 middleware factory：`validateRequest(schema)` 回傳驗證 req.body 的 middleware，失敗回傳 400 含欄位錯誤，或傳遞驗證資料給下個 handler。可重複用於多個 endpoints。 |

### 4.4 Express App Setup — `src/interfaces/app.ts`

| 檔案 | 功能說明 |
|------|---------|
| **app.ts** | Factory function `createApp(container)` 啟動 Express application：設定 JSON middleware、設置 /health health check endpoint、從 container.jwtService 建立 authMiddleware、註冊 routers (/api/users 公開、/api/groups & /api/expenses 受保護)、套用 errorHandler。回傳配置完成的 app instance 準備 listen()。 |

---

## 5. Shared Layer (共用層)

> 💡 **共用工具與模式**。所有檔案路徑位於 `src/shared/core/`

| 檔案 | 功能說明 |
|------|---------|
| **Entity.ts** | 所有 domain entities 的抽象基底類別：提供唯一 ID 生成 (UUID)、泛型 props 儲存、id getter。子類別 (User、Expense、Group) 擴展此類別以獲得持久化身份。 |
| **Result.ts** | Railway-oriented Result<T> monad 供錯誤處理：封裝 success/failure 狀態含選用錯誤訊息與值。方法：`ok(value)` factory for success、`fail(error)` for failure、`getValue()` 失敗時拋錯、`isSuccess`/`isFailure` flags。取代 try-catch 在 use cases 提供更乾淨的控制流。 |

---

## 6. 入口點

| 檔案 | 功能說明 |
|------|---------|
| **server.ts** | Production server 入口點：透過 DI 初始化 AppContainer、連接至 MongoDB、建立 Express app、監聽 port (env PORT 或 5000)。Graceful shutdown 處理。 |
| **test-server.ts** | Test server 變體：類似 server.ts 但配置給測試環境 (test database URI、不同 port)。供 E2E 測試套件使用。 |

---

## 前端架構

> 💡 **React 18 + TypeScript + Tailwind CSS (Pixel Art Theme)**。所有檔案路徑位於 `frontend/src/`

```
┌─────────────────────────────────────────────────────────────┐
│                      React App (Vite)                       │
│    Pages → Components → Hooks → API Client → Backend        │
└─────────────────────────────────────────────────────────────┘
```

### 1. Pages — `frontend/src/pages/`

| 檔案 | 功能說明 | 關鍵功能 |
|------|---------|---------|
| **DashboardPage.tsx** | 個人記帳儀表板：月度帳本、收支追蹤、分析分頁。顯示問候語、月度摘要 (收入/支出/淨值)、支出帳本依日期分組、快速操作按鈕。支援月份導航和動態分類 emoji 圖示。 | 月度支出篩選、分類圖示映射、日期分組邏輯、收支類型切換 |
| **GroupsPage.tsx** | 顯示使用者團隊群組 (排除個人群組)。功能：群組建立表單含驗證、團隊群組列表含成員數、建立/刪除操作。僅顯示 "Team" 類型群組；個人群組透過 Dashboard 存取。 | 群組建立 mutation、團隊群組篩選 |
| **GroupDetailPage.tsx** | 顯示個別群組詳情：使用者在該群組的餘額、待結算款項、快速操作按鈕 (新增支出/查看餘額)、**成員列表** (含 Avatar 顯示)、**邀請按鈕** (Team 群組顯示 QR Code)。Header 整合返回按鈕與群組名稱。 | 餘額查詢、成員列表 query、QR 邀請連結生成、結算預覽 |
| **AddExpensePage.tsx** | 複雜支出/收入輸入表單：支援個人帳本 (單一金額 + 類型切換) 或群組分攤 (等額/百分比/指定金額三種模式)。功能：分類選擇 (預設 + 自訂)、多筆付款列、成員選擇器、彈性分攤配置。處理 EXPENSE 和 INCOME 兩種類型，各有獨立自訂分類。 | 分攤模式邏輯、分類預設 (EXPENSE_CATEGORIES, INCOME_CATEGORIES)、自訂分類管理 (DB sync) |
| **BalancePage.tsx** | 顯示群組結算計算：最小交易列表清除債務、每位成員淨餘額、結算說明 (中文)。使用顏色編碼 (紅色給付款人、綠色給收款人) 並顯示個人化結算視圖。 | 結算渲染、餘額計算、每位成員餘額顯示 |
| **LoginPage.tsx** | 認證頁面：email/password 表單、驗證、錯誤處理。功能：pixel-art 品牌 (⚔ logo)、主題化 UI、連結至註冊頁。呼叫登入 API 並儲存 auth token/使用者資訊。 | 表單驗證、登入 mutation、重導至 dashboard |
| **RegisterPage.tsx** | 使用者註冊表單：name/email/password 欄位、密碼確認、重複 email 偵測、驗證反饋。註冊新使用者並成功時自動登入。 | 註冊 mutation、表單驗證 |
| **ProfilePage.tsx** | 使用者個人資料編輯器：name 更新、avatar 選擇器 (預設角色圖示或姓名縮寫)、密碼變更功能。功能：avatar 預覽、預設選擇器 (8 種角色 avatars)、自訂分類管理 UI。 | avatar 預設 (AVATAR_PRESETS)、個人資料 mutation、自訂分類系統 |
| **JoinGroupPage.tsx** | QR Code 掃描後的群組加入確認頁面。狀態流程：confirm (確認/取消按鈕) → joining (載入中) → success (加入成功，跳轉至群組) / error (顯示錯誤) / already_member (已是成員提示)。未登入時顯示登入提示連結。 | 邀請碼解析 (URL param)、joinByInvite mutation、多狀態 UI |

### 2. UI Components — `frontend/src/components/ui/`

> **可重複使用的 Pixel-Art 風格 UI 元件**

| 檔案 | 功能說明 | 關鍵匯出 |
|------|---------|---------|
| **PixelButton.tsx** | 復古 pixel 風格按鈕元件：variants (primary/secondary/danger/ghost/success)、sizes (sm/md/lg)、loading 狀態、full-width 選項。含陰影效果、hover/active 平移動畫、無障礙支援。 | `PixelButton` (forwardRef)、Variant & Size 型別定義 |
| **PixelCard.tsx** | Pixel 邊框卡片容器：可選 title/icon、顏色 variants (default/gold/green/red/dark)、padding 控制、陰影效果。用作表單區塊、資料顯示、內容分組的包裝器。 | `PixelCard` (forwardRef)、CardVariant 型別 |
| **PixelInput.tsx** | 文字輸入包裝器：label、錯誤顯示、hint 文字、驗證樣式。同時匯出 `PixelSelect` (下拉選單) 和 `PixelTextarea` 供表單欄位使用，一致的 pixel 樣式。 | `PixelInput`, `PixelSelect`, `PixelTextarea` (all forwardRef) |
| **PixelBadge.tsx** | 小型行內 badge/label 元件：顏色 variants (gold/green/red/cyan/muted)。同時匯出 `AmountBadge` 供顯示正/負金額含顏色編碼。 | `PixelBadge`, `AmountBadge` |
| **PixelLoader.tsx** | Loading 狀態元件：pixel spinner 動畫、可自訂文字、full-screen 選項。同時匯出 `PixelEmpty` (空狀態 UI) 和 `PixelError` (錯誤警示含重試按鈕)。 | `PixelLoader`, `PixelEmpty`, `PixelError` |
| **MemberAvatarPicker.tsx** | 多選按鈕群組供選擇群組成員：顯示成員 avatars (生成顏色或圖片)、名稱、切換選取狀態。Helper function `stringToColor()` 從 user IDs 生成確定性顏色。 | `MemberAvatarPicker`, `stringToColor()` helper |

### 3. Layout Components — `frontend/src/components/layout/`

| 檔案 | 功能說明 |
|------|---------|
| **Layout.tsx** | 認證頁面的根包裝器：含 Navbar、main content outlet (React Router Outlet)、skip-to-main 無障礙連結、裝飾性 pixel grid 背景疊加。為所有受保護路由提供一致的 layout 結構。 |
| **Navbar.tsx** | 響應式導航：桌面頂部欄和手機底部導航。功能：logo 連結、導航項目 (dashboard/groups)、使用者個人資料連結、登出按鈕。桌面顯示水平導航；手機使用固定底部導航含觸控友善間距。 |

### 4. Custom Hooks — `frontend/src/hooks/`

| 檔案 | 功能說明 |
|------|---------|
| **useGroupMembers.ts** | React Query hook 取得群組成員列表。接受可選 `groupId` 參數；query 僅在 groupId 為 truthy 時啟用。回傳標準 useQuery 物件 (data, isLoading, error)。 |
| **useLocalGroups.ts** | Zustand store hook 供本地快取群組：提供 `groups` 陣列、`addGroup()` 前置群組、`updateMemberCount()` 更新特定群組成員數。持久化至 localStorage 為 "splitquest-groups"。 |

### 5. State Management — `frontend/src/stores/`

| 檔案 | 功能說明 |
|------|---------|
| **authStore.ts** | 全域 auth 狀態使用 Zustand + localStorage 持久化 ("splitquest-auth")。儲存：userId, userName, userEmail, avatarUrl, personalGroupId, token, customCategories (expense/income 陣列)。方法：`login()` (設定所有欄位)、`updateUserInfo()` (部分更新)、`logout()` (清除所有)。自動持久化。 |

### 6. API & Utilities — `frontend/src/lib/`

| 檔案 | 功能說明 | 關鍵匯出 |
|------|---------|---------|
| **api.ts** | 集中式 API client：base path `/api` + Bearer token 自動注入。匯出：`ApiError` 類別、`userApi` (register/login/updateProfile)、`groupApi` (CRUD groups, getMembers, getBalance)、`expenseApi` (create/getByGroup)。從 localStorage token 自動處理 auth headers。請求/回應的型別定義 (Group, ExpenseRecord, Member, CreateExpenseRequest 等)。 | `ApiError`, `userApi`, `groupApi`, `expenseApi`, interface 定義, `request<T>()` helper |
| **queryClient.ts** | React Query 配置：staleTime 2 分鐘、1 次重試、refetchOnWindowFocus 停用。單一匯出 instance 用於 App.tsx QueryClientProvider。 | `queryClient` QueryClient instance |

### 7. App Routing & Setup — `frontend/src/`

| 檔案 | 功能說明 |
|------|---------|
| **App.tsx** | 根元件定義所有路由含 private/guest route guards。路由：`/login` & `/register` (僅訪客)、`/dashboard`、`/groups`、`/groups/:groupId`、`/groups/:groupId/expense/new`、`/groups/:groupId/balance`、`/profile` (private)。使用 `PrivateRoute` HOC 檢查 `useAuthStore().userId`。用 QueryClientProvider 包裝 app。 |
| **main.tsx** | React DOM 入口點：在 StrictMode 中將 App 元件渲染至 #root 元素。匯入全域樣式。 |

---

## 測試架構

### 單元測試 (Vitest) — `src/**/*.spec.ts`

**測試覆蓋**：67 tests passing

#### Domain Layer Tests
- **User.spec.ts**: User entity 測試 (create、validation、customCategories、updateCustomCategories)
- **Expense.spec.ts**: Expense entity 測試 (create、payments/splits、validation、amount calculation)
- **Group.spec.ts**: Group entity 測試 (PERSONAL/TEAM、addMember、validation)
- **BalanceService.spec.ts**: 結算邏輯測試 (netBalances、simplifyDebts、generateDescriptions)
- **SplitService.spec.ts**: 分攤計算測試 (EQUAL/PERCENTAGE/EXACT splits、validation)

#### Application Layer Tests
- **CreateExpenseUseCase.spec.ts**: 建立支出 use case 測試 (mock repositories、各種分攤場景、驗證邏輯)
- **GetBalanceUseCase.spec.ts**: 結算 use case 測試 (多筆支出整合、錯誤處理)

#### Interface Layer Tests
- **UserController.spec.ts**: Controller 測試 (updateMe with customCategories、login response、mock services)

**執行測試**: `npm test`  
**Type Check**: `npm run type-check`

### E2E 測試 (Playwright) — `e2e/`

測試完整使用者流程：
- 註冊 → 登入 → dashboard
- 建立群組 → 新增支出
- 查看餘額 → 結算計算

**執行 E2E**: `npm run test:e2e`  
**配置檔案**: `playwright.config.ts`

---

## 配置檔案

### 根目錄配置

| 檔案 | 用途 |
|------|------|
| **tsconfig.json** | TypeScript 編譯器配置：strict mode、path aliases (@domain, @application, etc.)、noUncheckedIndexedAccess、exactOptionalPropertyTypes |
| **vitest.config.ts** | Vitest 測試配置：path aliases、test environment |
| **playwright.config.ts** | Playwright E2E 測試配置 |
| **package.json** | 專案依賴與 scripts：build、test、dev、start |
| **docker-compose.yml** | Docker Compose 配置：MongoDB + Node.js app |
| **Dockerfile** | Docker image 建置配置 |
| **.env.example** | 環境變數範本：MONGODB_URI、JWT_SECRET、PORT |

### 前端配置

| 檔案 | 用途 |
|------|------|
| **frontend/vite.config.ts** | Vite 建置工具配置：React plugin、PWA 支援 (auto-update service worker、manifest with offline icons)、path alias `@` → `src/`、dev server port 5173、API proxy 至 `http://localhost:3000`。PWA manifest 含 app name (SplitQuest)、theme color (#0a0e1a)、icons (192/512px)、workbox caching (NetworkFirst for `/api/*`)。 |
| **frontend/tailwind.config.ts** | Tailwind CSS 配置擴展主題：custom fonts (Press Start 2P pixel、VT323 retro)、pixel 顏色面板 (12+ 顏色)、zero border radius (pixel aesthetic)、custom box shadows (4px offset)、custom font sizes、animations (blink、pixel-bounce、float-pixel with step timing)。 |
| **frontend/tsconfig.json** | 前端 TypeScript 配置：strict mode、ES2020 target、path alias `@/*` → `src/*`、JSX react-jsx、isolatedModules、bundler module resolution。 |
| **frontend/index.css** | 全域樣式：Tailwind directives、CSS custom properties for pixel colors、base reset (pixelated image rendering)、skip-link accessibility、custom animations (@keyframes)。 |

---

## Progressive Web App (PWA)

> 💡 **可安裝的離線優先應用**。配置於 `frontend/vite.config.ts`

### PWA 配置架構

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA Configuration                        │
│    vite-plugin-pwa → Workbox → Service Worker              │
└─────────────────────────────────────────────────────────────┘
```

### 核心配置

| 配置項 | 值 | 說明 |
|--------|-----|------|
| **registerType** | `autoUpdate` | Service Worker 自動更新，無需使用者確認 |
| **display** | `standalone` | 全螢幕 App 模式，隱藏瀏覽器 UI |
| **orientation** | `portrait-primary` | 預設直立方向 |
| **theme_color** | `#0a0e1a` | 狀態列顏色 (深藍黑) |
| **background_color** | `#0a0e1a` | 啟動畫面背景色 |

### Web App Manifest

```json
{
  "name": "SplitQuest — 像素分帳",
  "short_name": "SplitQuest",
  "description": "RPG 風格的分帳神器",
  "start_url": "/",
  "icons": [
    { "src": "icons/pwa-192.png", "sizes": "192x192" },
    { "src": "icons/pwa-512.png", "sizes": "512x512", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "新增支出", "url": "/expense/new" }
  ]
}
```

### Workbox 快取策略

| URL Pattern | 策略 | 說明 |
|-------------|------|------|
| `/api/*` | **NetworkFirst** | 優先網路，10 秒逾時後回退快取 |
| `*.{js,css,html,png,svg}` | **CacheFirst** | 靜態資源優先使用快取 |

### Service Worker 生命週期

1. **Install**: 預快取所有 glob patterns 匹配的靜態資源
2. **Activate**: 清除舊版快取，接管所有 clients
3. **Fetch**: 根據 URL pattern 套用對應快取策略

### 相關檔案

| 檔案 | 功能 |
|------|------|
| `frontend/vite.config.ts` | PWA plugin 配置 (VitePWA) |
| `frontend/public/icons/pwa-192.png` | 192x192 應用圖示 |
| `frontend/public/icons/pwa-512.png` | 512x512 應用圖示 (maskable) |
| `frontend/public/icons/pwa-96.png` | 96x96 快捷方式圖示 |
| `frontend/public/favicon.png` | Favicon 圖示 |
| `frontend/generate-icons.mjs` | 圖示生成腳本 (sharp) |

### 部署需求

- ✅ **HTTPS**: PWA 必須透過 HTTPS 提供服務
- ✅ **Manifest**: 需包含有效的 web app manifest
- ✅ **Service Worker**: 需在根路徑註冊

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      Express HTTP Server                    │
│    Routes → Middlewares → Controllers → Use Cases           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Application Layer                          │
│         Use Cases 編排 Domain Services                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Domain Layer                             │
│   Entities (User, Expense, Group, Payment, Split)           │
│   Services (BalanceService, SplitService)                   │
│   Repository Interfaces (IUserRepository, ...)              │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ implements
┌────────────────────────┴────────────────────────────────────┐
│                Infrastructure Layer                         │
│   MongoRepositories, BcryptPasswordService, JwtService      │
│   Dependency Injection Container (Awilix)                   │
└─────────────────────────────────────────────────────────────┘
```

**實踐的關鍵原則**:
- ✅ **Clean Architecture**: 依賴注入向內流動；domain layer 無外部依賴
- ✅ **Repository Pattern**: 抽象資料存取於介面後
- ✅ **Use Case Orchestration**: Application layer 協調 domain services 與 repositories
- ✅ **Value Objects**: Payment 與 Split 為不可變 value objects
- ✅ **Railway-Oriented Programming**: Result<T> 錯誤處理不用 exceptions
- ✅ **Zod Validation**: Controllers 中強型別 runtime schema 驗證
- ✅ **JWT Authentication**: Token-based auth + bcrypt 密碼 hashing

---

**文件版本**: 1.1  
**最後更新**: 2026-03-31  
**維護者**: SplitQuest Team
