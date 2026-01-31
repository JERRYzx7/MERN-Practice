import { Result } from "@shared/core/Result.js";
import { Expense } from "@domain/entities/Expense.js";
import { Split } from "@domain/entities/Split.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
// import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { SplitService } from "@domain/services/SplitService.js";

// 定義請求格式 (DTO)
interface CreateExpenseRequest {
  description: string;
  totalAmount: number;
  payerId: string;
  groupId: string;
  splitType: "EQUAL" | "PERCENTAGE" | "EXACT"; // 排除 SHARES (份數)
  // 根據 splitType 傳入對應的數據
  // EQUAL: 傳入 memberIds
  // PERCENTAGE: 傳入 { "userId": percentage }
  // EXACT: 傳入 { "userId": amount }
  splitData: any;
}

export class CreateExpenseUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private expenseRepo: IExpenseRepository,
  ) {}

  public async execute(request: CreateExpenseRequest): Promise<Result<void>> {
    // 1. 基本歸屬檢查
    const group = await this.groupRepo.findById(request.groupId);
    if (!group) return Result.fail("找不到該群組");

    const isPayerInGroup = await this.groupRepo.isUserInGroup(
      request.payerId,
      request.groupId,
    );
    if (!isPayerInGroup) return Result.fail("付款人不在該群組中");

    // 2. 根據類型處理分帳邏輯 (除了份數以外的模式)
    let splitsResult: Result<Split[]>;

    switch (request.splitType) {
      case "EQUAL":
        // 平分模式：splitData 預期為 string[] (memberIds)
        const equalSplits = SplitService.calculateEqualSplits(
          request.totalAmount,
          request.splitData,
        );
        splitsResult = Result.ok(equalSplits);
        break;

      case "PERCENTAGE":
        // 百分比模式：splitData 預期為 Record<string, number>
        splitsResult = SplitService.calculatePercentageSplits(
          request.totalAmount,
          request.splitData,
        );
        break;

      case "EXACT":
        // 指定金額模式：直接將數據轉為 Split 物件
        const exactSplits = Object.keys(request.splitData).map(
          (userId) => new Split({ userId, amount: request.splitData[userId] }),
        );
        splitsResult = Result.ok(exactSplits);
        break;

      default:
        return Result.fail("未知的分帳類型");
    }

    if (splitsResult.isFailure) return Result.fail(splitsResult.error!);
    const splits = splitsResult.getValue();

    // 3. 建立 Expense Entity (觸發三位一體驗證：A=B=C)
    // 這裡我們假設 payer 只有一個，金額就是 totalAmount
    const expenseResult = Expense.create({
      description: request.description,
      amount: request.totalAmount,
      payerId: request.payerId,
      groupId: request.groupId,
      splits: splits,
      date: new Date(),
    });

    if (expenseResult.isFailure) return Result.fail(expenseResult.error!);

    // 4. 持久化
    await this.expenseRepo.save(expenseResult.getValue());

    return Result.ok<void>();
  }
}
