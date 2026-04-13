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
  router.delete("/:groupId/members/me", controller.leaveGroup);
  router.delete("/:groupId/members/:memberId", controller.removeMember);
  router.get("/:groupId/balance", expenseController.getBalance);
  router.get("/:groupId/expenses", expenseController.getExpenses);
  
  // Invite routes
  router.post("/:groupId/invites", controller.createInvite);
  router.post("/join/:inviteCode", controller.joinByInvite);

  return router;
}
