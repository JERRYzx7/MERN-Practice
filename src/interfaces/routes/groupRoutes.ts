import { Router } from "express";
import type { GroupController } from "@interfaces/controllers/GroupController.js";
import type { ExpenseController } from "@interfaces/controllers/ExpenseController.js";

export function createGroupRouter(
  controller: GroupController,
  expenseController: ExpenseController,
): Router {
  const router = Router();

  router.get("/", controller.getGroups);
  router.post("/", controller.createGroup);
  router.get("/:groupId/members", controller.getMembers);
  router.post("/:groupId/members", controller.addMember);
  router.get("/:groupId/balance", expenseController.getBalance);
  router.get("/:groupId/expenses", expenseController.getExpenses);

  return router;
}
