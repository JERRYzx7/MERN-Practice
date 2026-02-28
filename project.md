# SplitWise Clone (MERN 全端架構)

## 1. 產品目標

打造一個高效、精確且可擴展的分帳系統。支援「個人私有記帳」與「多人團隊分帳」兩種模式，並確保帳務在複雜分攤情況下的平衡與一致性。

## 2. 核心功能

- **使用者管理**：註冊即自動生成個人私有群組。
- **群組系統**：支援個人模式（獨享）與團隊模式（多人邀請）。
- **靈活分帳**：
  - 等額平分 (Equal Split)
  - 百分比分帳 (Percentage Split)
  - 指定金額分帳 (Exact Amount Split)
- **結餘計算**：自動結算群組內成員間的債務關係 (GetBalance)。

## 3. 技術棧 (Tech Stack)

### 後端 (Backend)

- **語言**：TypeScript (ES Modules)
- **框架**：Express.js
- **架構**：Clean Architecture (CA)
  - 遵循 SOLID 原則
  - 嚴格區分 Domain, Application, Infrastructure 層
- **通訊協議**：Result Pattern (取代傳統 Try-Catch 錯誤處理)
- **資料庫**：MongoDB / Mongoose
- **基礎設施規劃**（使用者自行實作，AI 從旁輔助）：
  - 訊息佇列：Kafka (異步通知與報表更新)
  - 部署：Kubernetes (K8s)

### 前端 (Frontend)

- **框架**：React (Vite) 或 Next.js（待決定）
- **語言**：TypeScript
- **狀態管理**：待定（Zustand / React Query）
- **樣式方案**：Tailwind CSS + shadcn/ui（元件庫）
- **設計規範**：
  - 參考 `ui-ux-pro-max` skill（設計系統、色彩、字型、元件模式）
  - 遵循 `web-design-guidelines` skill（無障礙、語意 HTML、鍵盤導航）
  - 遵循 `vercel-react-best-practices` skill（效能優化、避免 waterfall、bundle size）
- **路由**：React Router v6 / Next.js App Router

### 測試策略

| 層級 | 工具 | 範圍 |
|------|------|------|
| 單元測試 | Vitest | Domain / Application Layer 業務邏輯 |
| 整合測試 | Vitest + Mock | Use Cases / Repository 介面 |
| E2E 測試 | Playwright | API 端點 + 前端使用者流程 |

- **開發方式**：TDD — Red → Green → Refactor (垂直切片，一次一行為)

## 4. 領域規則 (Business Rules)

- **三位一體平衡**：`支出總額` = `付款總額` = `分攤總額`。
- **浮點數防護**：所有金額計算均設有 0.011 的誤差容忍閾值。

## 5. 前端頁面規劃 (Frontend Pages)

| 頁面 | 路由 | 功能 |
|------|------|------|
| 登入 / 註冊 | `/login`, `/register` | 使用者認證 |
| 儀表板 | `/dashboard` | 個人總覽、近期支出、結餘摘要 |
| 群組列表 | `/groups` | 所有群組一覽 |
| 群組詳情 | `/groups/:id` | 群組支出列表、結餘計算結果 |
| 新增支出 | `/groups/:id/expense/new` | 選擇分帳模式、輸入金額與成員 |
| 結餘結算 | `/groups/:id/balance` | 債務簡化結果、轉帳清單 |
| 個人設定 | `/settings` | 個人資料管理 |

## 6. 專案結構規劃

```
/
├── backend/          ← 目前開發中 (Clean Architecture)
│   └── src/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── interfaces/
└── frontend/         ← 後端 API 穩定後開始
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        └── lib/
```
