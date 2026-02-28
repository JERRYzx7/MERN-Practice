import "dotenv/config";
import { connectDatabase } from "@infrastructure/database/connection.js";
import { buildContainer } from "@infrastructure/di/container.js";
import { createApp } from "@interfaces/app.js";

const PORT = process.env["PORT"] ?? 3000;

async function main(): Promise<void> {
  await connectDatabase();
  const container = buildContainer();
  const app = createApp(container);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
