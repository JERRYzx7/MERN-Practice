/**
 * Playwright Global Setup
 * test-server 使用 mongodb-memory-server，每次啟動自動是乾淨狀態。
 * 此檔案保留為未來新增 seed data 的擴充點。
 */
export default async function globalSetup(): Promise<void> {
  // in-memory MongoDB 每次 test-server 啟動時自動重置
  // 不需要手動清空 collections
  console.log("[E2E Setup] Using in-memory MongoDB ✓");
}
