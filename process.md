# 專案開發進度表 (Current Process)

## 🟢 Phase 1: 環境與基礎建設 (Completed)

- [x] Node.js ESM 環境設定 (`type: module`)
- [x] 核心工具實作：`Result` 類別 (工廠模式)
- [x] 測試環境架設：Vitest 配置完成

## 🟡 Phase 2: Domain Layer 領域核心 (In Progress - 90%)

- [x] **User Entity**: 基礎資訊與 Email 驗證。
- [x] **Group Entity**: 個人/團隊模式判斷邏輯。
- [x] **Expense Entity**: 支出結構與基礎對帳驗證。
- [x] **Split Value Object**: 分攤數據結構。
- [x] **SplitService**:
  - [x] 等額平分演算法
  - [x] 百分比分帳演算法
  - [x] 三位一體平衡驗證 (`validateBalance`)
- [ ] **Domain Logic**: 結餘計算矩陣演算法 (待開發)

## 🔵 Phase 3: Application Layer 業務流程 (Started)

- [x] **Repository Interfaces**: 定義 `IUser`, `IGroup`, `IExpense` 介面。
- [x] **CreateExpenseUseCase**:
  - [x] 實作跨實體調度流程。
  - [x] 實作 Mock Repositories 測試。
- [ ] **GetBalanceUseCase**: 取得群組結餘流程 (待開發)

## ⚪ Phase 4: Infrastructure Layer (Pending)

- [ ] MongoDB 連線設定
- [ ] Mongoose Schema 實作
- [ ] 真實 Repository 實作 (DIP 實踐)
