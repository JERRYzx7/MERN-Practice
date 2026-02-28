import { Router } from "express";
import type { RequestHandler } from "express";
import type { UserController } from "@interfaces/controllers/UserController.js";

export function createUserRouter(
  controller: UserController,
  authMiddleware?: RequestHandler,
): Router {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", controller.login);

  if (authMiddleware) {
    router.patch("/me", authMiddleware, controller.updateMe);
  }

  return router;
}
