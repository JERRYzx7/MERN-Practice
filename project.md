# SplitWise Clone (後端架構)

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

- **語言**：TypeScript (ES Modules)
- **架構**：Clean Architecture (CA)
  - 遵循 SOLID 原則
  - 嚴格區分 Domain, Application, Infrastructure 層
- **通訊協議**：Result Pattern (取代傳統 Try-Catch 錯誤處理)
- **測試工具**：Vitest (單元測試與業務流程驗證)
- **資料庫**：MongoDB / Mongoose (預計)
- **基礎設施規劃**：
  - 訊息佇列：Kafka (異步通知與報表更新)
  - 部署：Kubernetes (K8s)

## 4. 領域規則 (Business Rules)

- **三位一體平衡**：`支出總額` = `付款總額` = `分攤總額`。
- **浮點數防護**：所有金額計算均設有 0.011 的誤差容忍閾值。
