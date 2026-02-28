# 專案開發進度表 (Current Process)

## 🟢 Phase 0: DevOps 基礎 (Completed)

- [x] GitHub Actions CI 設定（`main` / `develop` branch 觸發）
- [x] Node 20.x / 22.x matrix 測試
- [x] `npm run type-check` + `npm test` 自動化
- [x] `package.json` 新增 `type-check`、`test:watch` scripts

## 🟢 Phase 1: 環境與基礎建設 (Completed)

- [x] Node.js ESM 環境設定 (`type: module`)
- [x] 核心工具實作：`Result` 類別 (工廠模式)
- [x] 測試環境架設：Vitest 配置完成

## 🟢 Phase 2: Domain Layer 領域核心 (Completed)

- [x] **User Entity**: 基礎資訊與 Email 驗證。
- [x] **Group Entity**: 個人/團隊模式判斷邏輯。
- [x] **Expense Entity**: 支出結構與基礎對帳驗證（含 `payerId` getter）。
- [x] **Split Value Object**: 分攤數據結構。
- [x] **SplitService**:
  - [x] 等額平分演算法
  - [x] 百分比分帳演算法
  - [x] 三位一體平衡驗證 (`validateBalance`)
  - [x] 指定金額分帳演算法 (`calculateExactSplits`)
- [x] **BalanceService**:
  - [x] 淨餘額計算矩陣演算法 (`calculateNetBalances`)
  - [x] 貪婪債務簡化演算法 (`simplifyDebts`)
  - [x] 可讀結算描述產生 (`generateDescriptions`)
  - [x] 完整 TDD 測試（9 個案例）

## 🟢 Phase 3: Application Layer 業務流程 (Completed)

- [x] **Repository Interfaces**: 定義 `IUser`, `IGroup`, `IExpense` 介面。
- [x] **CreateExpenseUseCase**:
  - [x] 實作跨實體調度流程（EQUAL / PERCENTAGE / EXACT 三模式）。
  - [x] 實作 Mock Repositories 測試（23 個測試案例）。
  - [x] `CreateExpenseDTO` 強型別 discriminated union（取代 `splitData: any`）
  - [x] EXACT 模式改呼叫 `SplitService.calculateExactSplits`（補上總額驗證）
- [x] **DTOs**: `CreateExpenseDTO`、`GetBalanceDTO`
- [x] **GetBalanceUseCase**: 取得群組結餘（調用 `BalanceService`，4 個 TDD 測試案例）

## 🟢 Phase 4: Infrastructure Layer (Completed)

- [x] MongoDB 連線設定（`connection.ts`，支援 `MONGODB_URI` env var）
- [x] Mongoose Schema 實作（`UserSchema`, `GroupSchema`, `ExpenseSchema`）
- [x] 真實 Repository 實作（`MongoUserRepository`, `MongoGroupRepository`, `MongoExpenseRepository`）
- [x] DI Container 設定（手動注入 `container.ts`）
- [ ] Kafka 事件發射（使用者主導）

## 🟢 Phase 5: Interface Layer (Completed)

- [x] Express App 入口（`interfaces/app.ts` + `server.ts`）
- [x] Controllers（`ExpenseController`, `GroupController`, `UserController`）
- [x] Routes 定義（`/api/expenses`, `/api/groups`, `/api/users`）
- [x] Global Error Middleware（`errorHandler.ts`，Result → HTTP Response 轉換）
- [x] Request Validation Middleware（`validateRequest.ts`，Zod Schema）
- [x] `IGroupRepository` 補上 `save()` method
- [x] Playwright E2E API 測試
  - `e2e/global-setup.ts` — 測試前清空 DB
  - `e2e/fixtures.ts` — testUser / testGroup fixtures（自動建立測試資料）
  - `e2e/api.spec.ts` — 17 個測試案例覆蓋所有 API 端點
  - `playwright.config.ts` — webServer 自動啟動 server（port 3001）

## 🟢 Phase 6: Frontend - React SPA (Completed)

### 技術選型
- Vite + React 18 + TypeScript（Strict Mode）
- Tailwind CSS（自訂像素設計系統，0px borderRadius）
- 字型：Press Start 2P + VT323
- 狀態：Zustand + TanStack Query
- 路由：React Router v6
- PWA：vite-plugin-pwa（manifest 內嵌，autoUpdate）
- RWD：mobile-first，md/lg breakpoints

### 完成項目
- [x] 設定檔（`package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`）
- [x] `index.html`（Google Fonts：Press Start 2P + VT323）
- [x] `src/index.css`（CSS 變數、Tailwind utilities、scanlines、skip-link、像素捲軸）
- [x] `src/main.tsx` + `src/App.tsx`（React Router v6，PrivateRoute / GuestRoute）
- [x] `src/lib/api.ts`（型別安全 fetch client，全 API 端點）
- [x] `src/lib/queryClient.ts`（TanStack Query）
- [x] `src/stores/authStore.ts`（Zustand + localStorage persist）
- [x] `src/hooks/useLocalGroups.ts`（群組本地狀態，Zustand persist）
- [x] 元件庫：`PixelButton`、`PixelCard`、`PixelInput`、`PixelBadge`、`PixelLoader`（a11y 完整）
- [x] Layout：`Layout.tsx` + `Navbar.tsx`（桌面 top bar + 手機 bottom nav）
- [x] 頁面（7個）：`LoginPage`、`RegisterPage`、`DashboardPage`、`GroupsPage`、`GroupDetailPage`、`AddExpensePage`、`BalancePage`
- [x] `public/favicon.svg`（像素金幣風格）
- [x] `generate-icons.mjs`（純 Node.js PWA icon 產生腳本）
- [x] `UserController.register` 回傳 `personalGroupId`

---

## 🟢 Phase 7: 密碼驗證 + JWT Auth + Docker MongoDB (Completed)

### 完成項目

#### Domain / Infrastructure 層
- [x] `User` entity 新增 `passwordHash`、`avatarUrl`、`oauthProvider`、`oauthId` 欄位
- [x] `UserSchema` 新增對應 DB 欄位（全部 nullable）
- [x] `MongoUserRepository` 更新 save / findById / findByEmail / findByIds
- [x] `Expense` entity + `ExpenseSchema` 新增 `currency: string`（必填，default `"TWD"`）
- [x] `MongoExpenseRepository` 更新 save / toDomain
- [x] `CreateExpenseDTO` + `CreateExpenseUseCase` 加入 `currency`
- [x] `ExpenseController` Zod schema 加入 `currency`

#### Auth 服務層
- [x] `src/application/services/IPasswordService.ts`（策略模式介面）
- [x] `src/application/services/IJwtService.ts`（策略模式介面）
- [x] `src/infrastructure/services/BcryptPasswordService.ts`（bcrypt salt 12）
- [x] `src/infrastructure/services/JwtService.ts`（HS256，JWT_SECRET env var）

#### Interface 層
- [x] `UserController.register` — hash 密碼、回傳 JWT token
- [x] `UserController.login` — 驗證密碼、簽發 JWT（`POST /api/users/login`）
- [x] `src/interfaces/middlewares/authMiddleware.ts` — Bearer token 驗證，注入 `req.userId`
- [x] `userRoutes.ts` 新增 `POST /login`
- [x] `app.ts` `/api/groups` + `/api/expenses` 受 auth middleware 保護

#### DI Container
- [x] `container.ts` 注入 `BcryptPasswordService` + `JwtService`
- [x] `AppContainer` interface 新增 `jwtService` 供 `app.ts` 使用

#### Docker
- [x] `docker-compose.yml`（MongoDB 7.0，named volume，預留 Redis slot）
- [x] `.env.example`（MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, PORT）

#### 前端
- [x] `api.ts` — `userApi.login`、`AuthResponse`（含 token）、所有請求自動帶 Authorization header、`currency` 欄位
- [x] `authStore.ts` — 新增 `token` 欄位
- [x] `LoginPage.tsx` — 改用真實 `POST /api/users/login` + 密碼欄位
- [x] `RegisterPage.tsx` — 新增密碼 + 確認密碼欄位

#### 文件
- [x] `api-doc.md` — 完整 API 文件（所有端點、欄位、錯誤碼、JWT payload）

---

## 📊 整體進度

| Phase | 狀態 | 完成度 |
|-------|------|--------|
| Phase 0: DevOps | ✅ 完成 | 100% |
| Phase 1: 環境建設 | ✅ 完成 | 100% |
| Phase 2: Domain Layer | ✅ 完成 | 100% |
| Phase 3: Application Layer | ✅ 完成 | 100% |
| Phase 4: Infrastructure Layer | ✅ 完成 | 100% |
| Phase 5: Interface Layer | ✅ 完成 | 100% |
| Phase 6: Frontend SPA | ✅ 完成 | 100% |
| Phase 7: Auth + Docker | ✅ 完成 | 100% |
| Phase 8: OAuth（產品上線後）| ⬜ 待規劃 | 0% |
