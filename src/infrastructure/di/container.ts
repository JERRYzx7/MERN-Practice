import { MongoUserRepository } from "@infrastructure/database/MongoUserRepository.js";
import { MongoGroupRepository } from "@infrastructure/database/MongoGroupRepository.js";
import { MongoExpenseRepository } from "@infrastructure/database/MongoExpenseRepository.js";
import { CreateExpenseUseCase } from "@application/use-cases/CreateExpenseUseCase.js";
import { GetBalanceUseCase } from "@application/use-cases/GetBalanceUseCase.js";
import { ExpenseController } from "@interfaces/controllers/ExpenseController.js";
import { GroupController } from "@interfaces/controllers/GroupController.js";
import { UserController } from "@interfaces/controllers/UserController.js";

export interface AppContainer {
  expenseController: ExpenseController;
  groupController: GroupController;
  userController: UserController;
}

export function buildContainer(): AppContainer {
  // Infrastructure
  const userRepo = new MongoUserRepository();
  const groupRepo = new MongoGroupRepository();
  const expenseRepo = new MongoExpenseRepository();

  // Application Use Cases
  const createExpenseUseCase = new CreateExpenseUseCase(groupRepo, expenseRepo);
  const getBalanceUseCase = new GetBalanceUseCase(groupRepo, expenseRepo);

  // Interface Controllers
  const expenseController = new ExpenseController(createExpenseUseCase, getBalanceUseCase);
  const groupController = new GroupController(groupRepo);
  const userController = new UserController(userRepo, groupRepo);

  return { expenseController, groupController, userController };
}
