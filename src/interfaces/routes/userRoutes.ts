import { Router } from "express";
import type { UserController } from "@interfaces/controllers/UserController.js";

export function createUserRouter(controller: UserController): Router {
  const router = Router();

  router.post("/register", controller.register);

  return router;
}
