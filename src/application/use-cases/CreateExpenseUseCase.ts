import { Result } from "@shared/core/Result.js";
import { Expense } from "@domain/entities/Expense.js";
import { Split } from "@domain/entities/Split.js";
import { Payment } from "@domain/entities/Payment.js";
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

    // Validate primary payer (first payment) is in the group
    const primaryPayerId = request.payments[0]?.userId;
    if (!primaryPayerId) return Result.fail("至少需要有一個付款項目");

    const isPayerInGroup = await this.groupRepo.isUserInGroup(
      primaryPayerId,
      request.groupId,
    );
    if (!isPayerInGroup) return Result.fail("付款人不在該群組中");

    // 2. Derive totalAmount from payments
    const totalAmount = request.payments.reduce((sum, p) => sum + p.amount, 0);

    // 3. 根據 splitType 分派到 SplitService
    const splitsResult = (() => {
      switch (request.splitType) {
        case "EQUAL":
          return Result.ok(
            SplitService.calculateEqualSplits(totalAmount, request.memberIds),
          );
        case "PERCENTAGE":
          return SplitService.calculatePercentageSplits(
            totalAmount,
            request.percentageMap,
          );
        case "EXACT":
          return SplitService.calculateExactSplits(
            totalAmount,
            request.exactMap,
          );
        default:
          return Result.fail<Split[]>(`未知的分帳類型`);
      }
    })();

    if (splitsResult.isFailure) return Result.fail(splitsResult.error!);
    const splits = splitsResult.getValue();

    // 4. 建立 Expense Entity
    const payments = request.payments.map(
      (p) =>
        new Payment({
          userId: p.userId,
          amount: p.amount,
          ...(p.note !== undefined ? { note: p.note } : {}),
        }),
    );

    const expenseResult = Expense.create({
      description: request.description,
      currency: request.currency ?? "TWD",
      groupId: request.groupId,
      payments,
      splits,
      date: new Date(),
    });

    if (expenseResult.isFailure) return Result.fail(expenseResult.error!);

    // 5. 持久化
    await this.expenseRepo.save(expenseResult.getValue());

    return Result.ok<void>();
  }
}

