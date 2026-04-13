import { MongoUserRepository } from "@infrastructure/database/MongoUserRepository.js";
import { MongoGroupRepository } from "@infrastructure/database/MongoGroupRepository.js";
import { MongoExpenseRepository } from "@infrastructure/database/MongoExpenseRepository.js";
import { BcryptPasswordService } from "@infrastructure/services/BcryptPasswordService.js";
import { JwtService } from "@infrastructure/services/JwtService.js";
import { CreateExpenseUseCase } from "@application/use-cases/CreateExpenseUseCase.js";
import { GetBalanceUseCase } from "@application/use-cases/GetBalanceUseCase.js";
import { GetGroupsUseCase } from "@application/use-cases/GetGroupsUseCase.js";
import { GetExpensesUseCase } from "@application/use-cases/GetExpensesUseCase.js";
import { GetGroupMembersUseCase } from "@application/use-cases/GetGroupMembersUseCase.js";
import { CreateInviteUseCase } from "@application/use-cases/CreateInviteUseCase.js";
import { JoinByInviteUseCase } from "@application/use-cases/JoinByInviteUseCase.js";
import { RemoveGroupMemberUseCase } from "@application/use-cases/RemoveGroupMemberUseCase.js";
import { ExpenseController } from "@interfaces/controllers/ExpenseController.js";
import { GroupController } from "@interfaces/controllers/GroupController.js";
import { UserController } from "@interfaces/controllers/UserController.js";
import type { IJwtService } from "@application/services/IJwtService.js";

export interface AppContainer {
  expenseController: ExpenseController;
  groupController: GroupController;
  userController: UserController;
  jwtService: IJwtService;
}

export function buildContainer(): AppContainer {
  // Infrastructure
  const userRepo = new MongoUserRepository();
  const groupRepo = new MongoGroupRepository();
  const expenseRepo = new MongoExpenseRepository();

  // Services
  const passwordService = new BcryptPasswordService();
  const jwtService = new JwtService(
    process.env["JWT_SECRET"] ?? "dev_secret_change_in_production",
    process.env["JWT_EXPIRES_IN"] ?? "7d",
  );

  // Application Use Cases
  const createExpenseUseCase = new CreateExpenseUseCase(groupRepo, expenseRepo);
  const getBalanceUseCase = new GetBalanceUseCase(groupRepo, expenseRepo);
  const getGroupsUseCase = new GetGroupsUseCase(groupRepo);
  const getExpensesUseCase = new GetExpensesUseCase(expenseRepo);
  const getGroupMembersUseCase = new GetGroupMembersUseCase(groupRepo, userRepo);
  const createInviteUseCase = new CreateInviteUseCase(groupRepo);
  const joinByInviteUseCase = new JoinByInviteUseCase(groupRepo);
  const removeGroupMemberUseCase = new RemoveGroupMemberUseCase(groupRepo, expenseRepo);

  // Interface Controllers
  const expenseController = new ExpenseController(createExpenseUseCase, getBalanceUseCase, getExpensesUseCase);
  const groupController = new GroupController(
    groupRepo,
    getGroupsUseCase,
    getGroupMembersUseCase,
    createInviteUseCase,
    joinByInviteUseCase,
    removeGroupMemberUseCase,
  );
  const userController = new UserController(userRepo, groupRepo, passwordService, jwtService);

  return { expenseController, groupController, userController, jwtService };
}
