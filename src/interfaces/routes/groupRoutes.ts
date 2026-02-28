import { Router } from "express";
import type { GroupController } from "@interfaces/controllers/GroupController.js";
import type { ExpenseController } from "@interfaces/controllers/ExpenseController.js";

export function createGroupRouter(
  controller: GroupController,
  expenseController: ExpenseController,
): Router {
  const router = Router();

  router.post("/", controller.createGroup);
  router.post("/:groupId/members", controller.addMember);
  router.get("/:groupId/balance", expenseController.getBalance);

  return router;
}
