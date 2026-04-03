# SplitQuest (MERN 全端架構)

## 1. 產品目標

打造一個高效、精確且可擴展的分帳系統。支援「個人私有記帳」與「多人團隊分帳」兩種模式，並確保帳務在複雜分攤情況下的平衡與一致性。採用像素 RPG 遊戲風格的 UI 設計。

## 2. 核心功能

- **使用者管理**：註冊（含密碼）即自動生成個人私有群組；頭貼支援 Gravatar 自動產生。
- **認證系統**：JWT Token（HS256），無狀態認證，前端 Bearer header 攜帶。
- **群組系統**：
  - 個人模式（獨享記帳）
  - 團隊模式（多人分帳）
  - **QR Code 邀請連結**（7天有效期，掃碼/點擊即可加入）
- **支出/收入記錄**：
  - 支援支出 (EXPENSE) 與收入 (INCOME) 兩種類型
  - 預設分類（餐飲、交通、薪水、獎金等）
  - **自訂分類**（存儲於 MongoDB，跨裝置同步）
- **靈活分帳**：
  - 等額平分 (Equal Split)
  - 百分比分帳 (Percentage Split)
  - 指定金額分帳 (Exact Amount Split)
  - **多人付款**（Multi-payer，支援 AA 制等場景）
- **結餘計算**：自動結算群組內成員間的債務關係 (GetBalance)。
- **儀表板**：
  - 月度收支統計（收入/支出/淨額）
  - 日曆式帳目瀏覽（按日分組）
  - 類別圖標顯示

## 3. 技術棧 (Tech Stack)

### 後端 (Backend)

- **語言**：TypeScript (ES Modules, Strict Mode)
- **框架**：Express.js
- **架構**：Clean Architecture (CA)
  - 遵循 SOLID 原則
  - 嚴格區分 Domain, Application, Infrastructure, Interface 層
- **通訊協議**：Result Pattern (取代傳統 Try-Catch 錯誤處理)
- **資料庫**：MongoDB / Mongoose（開發用 Docker，測試用 mongodb-memory-server）
- **認證**：bcrypt（密碼 hash）+ jsonwebtoken（JWT 簽發）
- **基礎設施規劃**（使用者自行實作，AI 從旁輔助）：
  - 訊息佇列：Kafka (異步通知與報表更新)
  - 快取：Redis（未來加入）
  - 部署：Kubernetes (K8s)

### 前端 (Frontend)

- **框架**：React 18 + Vite (SPA)
- **語言**：TypeScript (Strict Mode)
- **狀態管理**：Zustand（auth + 本地群組）+ TanStack Query（API 快取）
- **樣式方案**：Tailwind CSS（自訂像素設計系統，0px borderRadius）
- **設計主題**：SplitQuest — 像素 RPG 風格（Press Start 2P + VT323 字型）
- **路由**：React Router v6
- **PWA**：vite-plugin-pwa（autoUpdate + 離線快取）
- **RWD**：Mobile-first，md/lg breakpoints

### 基礎設施

| 環境 | 工具 |
|------|------|
| 本機開發 | Docker Compose（MongoDB + 未來 Redis）|
| E2E 測試 | mongodb-memory-server（無需本機 MongoDB）|
| 正式環境 | Kubernetes（Deployment + StatefulSet + PVC）|

**Docker Compose → K8s 對應：**
- `service` → `Deployment` / `StatefulSet`（DB 用 StatefulSet）
- `named volume` → `PersistentVolumeClaim`
- `environment` → `ConfigMap` + `Secret`
- `MONGODB_URI` env var 跨環境切換，不改程式碼

### 測試策略

| 層級 | 工具 | 範圍 |
|------|------|------|
| 單元測試 | Vitest | Domain / Application Layer 業務邏輯 |
| 整合測試 | Vitest + Mock | Use Cases / Repository 介面 |
| E2E 測試 | Playwright | API 端點（port 3001 + in-memory DB）|

- **開發方式**：TDD — Red → Green → Refactor
- **vitest** 排除 `e2e/`；**Playwright** 使用 `src/test-server.ts` 獨立啟動

## 4. 領域規則 (Business Rules)

- **三位一體平衡**：`支出總額` = `付款總額` = `分攤總額`。
- **浮點數防護**：所有金額計算均設有 0.011 的誤差容忍閾值。
- **currency 在 Expense**：每筆支出帶幣別（未來 Phase 加入），User 不儲存預設幣別。

## 5. User 欄位設計

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string (UUID) | 主鍵 |
| `name` | string | 顯示名稱 |
| `email` | string | 唯一，用於登入 |
| `passwordHash` | string | bcrypt hash |
| `personalGroupId` | string? | 自動建立的個人群組 |
| `avatarUrl` | string? | 選填；預設 Gravatar `?d=retro`（像素風格）|
| `customCategories` | object? | `{ expense: string[], income: string[] }` 自訂分類 |

> `currency` 和 `displayColor` 不在 User：currency 屬於 Expense；displayColor 用 Gravatar 替代。

## 6. Group 欄位設計

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string (UUID) | 主鍵 |
| `name` | string | 群組名稱 |
| `type` | "Personal" \| "Team" | 群組類型 |
| `ownerId` | string | 擁有者 ID |
| `memberIds` | string[] | 成員 ID 列表 |
| `inviteTokens` | InviteToken[]? | 邀請連結列表 |

**InviteToken 結構**：
| 欄位 | 型別 | 說明 |
|------|------|------|
| `code` | string (UUID) | 邀請碼 |
| `expiresAt` | Date | 過期時間（預設 7 天）|
| `createdBy` | string | 建立者 ID |

## 7. 前端頁面規劃

| 頁面 | 路由 | 功能 |
|------|------|------|
| 登入 | `/login` | email + password 登入 |
| 註冊 | `/register` | 建立帳號（含密碼）|
| 儀表板 | `/dashboard` | 個人總覽、月度收支、帳目列表 |
| 群組列表 | `/groups` | 所有群組一覽、新建群組 |
| 群組詳情 | `/groups/:id` | 結餘、成員管理、邀請連結 |
| 新增支出 | `/groups/:id/expense/new` | 支出/收入、分類選擇、分帳模式 |
| 結餘結算 | `/groups/:id/balance` | 最少轉帳次數結算清單 |
| 個人設定 | `/profile` | 個人資料、頭貼、自訂分類 |
| 加入群組 | `/join/:inviteCode` | QR Code 掃碼後自動加入群組 |

## 8. 專案結構

```
D:\mern\
├── src/                    ← 後端（Clean Architecture）
│   ├── domain/             ← Entity、Repository Interface、Domain Service
│   ├── application/        ← UseCase、DTO、Service Interface
│   ├── infrastructure/     ← Mongoose、Repository 實作、DI Container、外部服務
│   └── interfaces/         ← Express Controller、Route、Middleware
├── frontend/               ← React SPA（Vite + TypeScript）
│   └── src/
│       ├── components/     ← PixelButton、PixelCard、PixelInput 等 UI 元件
│       ├── pages/          ← 9 個頁面（含 JoinGroupPage）
│       ├── hooks/          ← useLocalGroups
│       ├── stores/         ← authStore（Zustand + persist）
│       └── lib/            ← api.ts、queryClient.ts
├── e2e/                    ← Playwright E2E 測試
├── ARCHITECTURE.md         ← 詳細架構文件（74 個檔案說明）
├── docker-compose.yml      ← MongoDB 開發環境
└── .github/workflows/      ← CI（Node 20.x / 22.x）
```

