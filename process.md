# 專案開發進度表 (Current Process)

## 🟢 Phase 1: 環境與基礎建設 (Completed)

- [x] Node.js ESM 環境設定 (`type: module`)
- [x] 核心工具實作：`Result` 類別 (工廠模式)
- [x] 測試環境架設：Vitest 配置完成

## 🟢 Phase 2: Domain Layer 領域核心 (Completed - 100%)

- [x] **User Entity**: 基礎資訊與 Email 驗證。
- [x] **Group Entity**: 個人/團隊模式判斷邏輯。
- [x] **Expense Entity**: 支出結構與基礎對帳驗證（含 `payerId` getter）。
- [x] **Split Value Object**: 分攤數據結構。
- [x] **SplitService**:
  - [x] 等額平分演算法
  - [x] 百分比分帳演算法
  - [x] 三位一體平衡驗證 (`validateBalance`)
- [x] **BalanceService** (新完成):
  - [x] 淨餘額計算矩陣演算法 (`calculateNetBalances`)
  - [x] 貪婪債務簡化演算法 (`simplifyDebts`)
  - [x] 可讀結算描述產生 (`generateDescriptions`)
  - [x] 完整 TDD 測試（9 個案例）
- [ ] **SplitService**: 指定金額分帳演算法 (`calculateExactSplits`) ⚠️ 缺失

## 🟡 Phase 3: Application Layer 業務流程 (In Progress - 40%)

- [x] **Repository Interfaces**: 定義 `IUser`, `IGroup`, `IExpense` 介面。
- [x] **CreateExpenseUseCase**:
  - [x] 實作跨實體調度流程（EQUAL / PERCENTAGE / EXACT 三模式）。
  - [x] 實作 Mock Repositories 測試（23 個測試案例）。
  - [ ] `splitData: any` 型別需改為強型別 DTO ⚠️
  - [ ] EXACT 模式缺少 `SplitService` 層級的總額驗證 ⚠️
- [ ] **GetBalanceUseCase**: 取得群組結餘流程（調用 `BalanceService`）
- [ ] **DTOs**: 定義 `CreateExpenseDTO`、`GetBalanceDTO` 等輸入型別

## ⚪ Phase 4: Infrastructure Layer (Pending)

- [ ] MongoDB 連線設定（`mongoose.connect`）
- [ ] Mongoose Schema 實作（User / Group / Expense）
- [ ] 真實 Repository 實作（`MongoUserRepo`, `MongoGroupRepo`, `MongoExpenseRepo`）
- [ ] DI Container 設定（Awilix 或手動注入）
- [ ] Kafka 事件發射（`ExpenseCreatedEvent` 骨架）

## ⚪ Phase 5: Interface Layer (Pending)

- [ ] Express App 入口（`app.ts` / `server.ts`）
- [ ] Controllers（`ExpenseController`, `GroupController`, `UserController`）
- [ ] Routes 定義（`/api/expenses`, `/api/groups`, `/api/users`）
- [ ] Global Error Middleware（統一 Result → HTTP Response 轉換）
- [ ] Request Validation Middleware（Zod Schema）

---

## 📊 整體進度

| Phase | 狀態 | 完成度 |
|-------|------|--------|
| Phase 1: 環境建設 | ✅ 完成 | 100% |
| Phase 2: Domain Layer | ✅ 完成 | 100% |
| Phase 3: Application Layer | 🟡 進行中 | 40% |
| Phase 4: Infrastructure Layer | ⚪ 待開始 | 0% |
| Phase 5: Interface Layer | ⚪ 待開始 | 0% |
