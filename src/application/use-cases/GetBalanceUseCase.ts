import { Result } from "@shared/core/Result.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import {
  BalanceService,
  type BalanceResult,
} from "@domain/services/BalanceService.js";

export interface GetBalanceDTO {
  groupId: string;
}

export class GetBalanceUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private expenseRepo: IExpenseRepository,
  ) {}

  public async execute(
    request: GetBalanceDTO,
  ): Promise<Result<BalanceResult>> {
    // 1. 確認群組存在
    const group = await this.groupRepo.findById(request.groupId);
    if (!group) return Result.fail("找不到該群組");

    // 2. 取得群組所有支出
    const expenses = await this.expenseRepo.findByGroupId(request.groupId);

    // 3. 委派 BalanceService 計算結餘
    const balanceResult = BalanceService.calculate(expenses);

    return Result.ok(balanceResult);
  }
}
