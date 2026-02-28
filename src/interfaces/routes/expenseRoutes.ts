import { Router } from "express";
import type { ExpenseController } from "@interfaces/controllers/ExpenseController.js";

export function createExpenseRouter(controller: ExpenseController): Router {
  const router = Router();

  router.post("/", controller.createExpense);

  return router;
}
