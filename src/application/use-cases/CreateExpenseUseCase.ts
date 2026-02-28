import { Result } from "@shared/core/Result.js";
import { Expense } from "@domain/entities/Expense.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { SplitService } from "@domain/services/SplitService.js";
import type { CreateExpenseDTO } from "@application/dtos/CreateExpenseDTO.js";

export class CreateExpenseUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private expenseRepo: IExpenseRepository,
  ) {}

  public async execute(request: CreateExpenseDTO): Promise<Result<void>> {
    // 1. 基本歸屬檢查
    const group = await this.groupRepo.findById(request.groupId);
    if (!group) return Result.fail("找不到該群組");

    const isPayerInGroup = await this.groupRepo.isUserInGroup(
      request.payerId,
      request.groupId,
    );
    if (!isPayerInGroup) return Result.fail("付款人不在該群組中");

    // 2. 根據 splitType 分派到 SplitService
    const splitsResult = (() => {
      switch (request.splitType) {
        case "EQUAL":
          return Result.ok(
            SplitService.calculateEqualSplits(
              request.totalAmount,
              request.memberIds,
            ),
          );
        case "PERCENTAGE":
          return SplitService.calculatePercentageSplits(
            request.totalAmount,
            request.percentageMap,
          );
        case "EXACT":
          return SplitService.calculateExactSplits(
            request.totalAmount,
            request.exactMap,
          );
        default:
          return Result.fail(`Unknown splitType: ${(request as { splitType: string }).splitType}`);
      }
    })();

    if (splitsResult.isFailure) return Result.fail(splitsResult.error!);
    const splits = splitsResult.getValue();

    // 3. 建立 Expense Entity (三位一體驗證：A=B=C)
    const expenseResult = Expense.create({
      description: request.description,
      amount: request.totalAmount,
      payerId: request.payerId,
      groupId: request.groupId,
      splits,
      date: new Date(),
    });

    if (expenseResult.isFailure) return Result.fail(expenseResult.error!);

    // 4. 持久化
    await this.expenseRepo.save(expenseResult.getValue());

    return Result.ok<void>();
  }
}

