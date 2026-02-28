import express from "express";
import { errorHandler } from "@interfaces/middlewares/errorHandler.js";
import { createAuthMiddleware } from "@interfaces/middlewares/authMiddleware.js";
import { createExpenseRouter } from "@interfaces/routes/expenseRoutes.js";
import { createGroupRouter } from "@interfaces/routes/groupRoutes.js";
import { createUserRouter } from "@interfaces/routes/userRoutes.js";
import type { AppContainer } from "@infrastructure/di/container.js";

export function createApp(container: AppContainer): express.Application {
  const app = express();

  app.use(express.json());

  // Health check for Playwright E2E tests
  app.get("/health", (_req, res) => { res.json({ ok: true }); });

  // Public routes
  app.use("/api/users", createUserRouter(container.userController));

  // Protected routes
  const auth = createAuthMiddleware(container.jwtService);
  app.use("/api/groups", auth, createGroupRouter(container.groupController, container.expenseController));
  app.use("/api/expenses", auth, createExpenseRouter(container.expenseController));

  app.use(errorHandler);

  return app;
}
