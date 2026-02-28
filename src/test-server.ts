/**
 * E2E 測試專用 server entry point
 * 自動啟動 mongodb-memory-server，不需要本地 MongoDB
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase } from "./infrastructure/database/connection.js";
import { buildContainer } from "./infrastructure/di/container.js";
import { createApp } from "./interfaces/app.js";

const PORT = process.env["PORT"] ?? 3001;

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();

await connectDatabase(uri);
const container = buildContainer();
const app = createApp(container);

const server = app.listen(PORT, () => {
  console.log(`[Test Server] Running on port ${PORT} (in-memory MongoDB)`);
});

// 收到 SIGTERM 時優雅關閉（Playwright 結束時會發送）
process.on("SIGTERM", async () => {
  server.close();
  await mongod.stop();
  process.exit(0);
});
