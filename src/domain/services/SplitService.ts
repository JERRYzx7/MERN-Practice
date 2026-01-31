import { Result } from "@shared/core/Result.js";
import { Split } from "@domain/entities/Split.js";

export interface PayerData {
  userId: string;
  amount: number;
}

export class SplitService {
  /**
   * 驗證分帳邏輯是否平衡
   * @param totalAmount 總支出金額
   * @param payers 付款人清單 (B)
   * @param owerSplits 應付分攤清單 (C)
   */
  public static validateBalance(
    totalAmount: number,
    payers: PayerData[],
    owerSplits: Split[],
  ): Result<void> {
    // 1. 驗證付款總額是否等於總支出 (A = B)
    const totalPaid = payers.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPaid - totalAmount) > 0.011) {
      return Result.fail<void>(
        `付款總額 (${totalPaid}) 不等於支出總額 (${totalAmount})`,
      );
    }

    // 2. 驗證分攤總額是否等於總支出 (A = C)
    const totalOwed = owerSplits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalOwed - totalAmount) > 0.011) {
      return Result.fail<void>(
        `分攤總額 (${totalOwed}) 不等於支出總額 (${totalAmount})`,
      );
    }

    return Result.ok<void>();
  }

  /**
   * 預設平分邏輯：若未指定分攤金額，則執行平分
   */
  public static calculateEqualSplits(
    totalAmount: number,
    userIds: string[],
  ): Split[] {
    const perPerson = Math.floor((totalAmount / userIds.length) * 100) / 100;
    const splits = userIds.map(
      (id) => new Split({ userId: id, amount: perPerson }),
    );

    // 處理餘數，補在第一個人身上
    const totalCurrent = perPerson * userIds.length;
    const remainder = Math.round((totalAmount - totalCurrent) * 100) / 100;

    if (remainder !== 0 && splits.length > 0) {
      // 使用 Split Entity 的 adjustAmount 方法處理餘數
      const firstSplit = splits[0];
      if (firstSplit) {
        splits[0] = firstSplit.adjustAmount(firstSplit.amount + remainder);
      }
    }

    return splits;
  }

  /**
   * 百分比分帳邏輯
   * @param totalAmount 總支出金額
   * @param percentageMap 使用者百分比對應表 { userId: percentage }
   * @returns Result<Split[]> 成功時回傳分帳清單，失敗時回傳錯誤訊息
   */
  public static calculatePercentageSplits(
    totalAmount: number,
    percentageMap: Record<string, number>,
  ): Result<Split[]> {
    // 1. 驗證百分比總和是否等於 100
    const totalPercentage = Object.values(percentageMap).reduce(
      (sum, p) => sum + p,
      0,
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return Result.fail<Split[]>(
        `百分比總和 (${totalPercentage}%) 必須等於 100%`,
      );
    }

    // 2. 計算每個人的分攤金額
    const userIds = Object.keys(percentageMap);
    const splits: Split[] = [];

    for (const userId of userIds) {
      const percentage = percentageMap[userId];
      if (percentage === undefined) {
        return Result.fail<Split[]>(`使用者 ${userId} 的百分比未定義`);
      }
      const amount = Math.round(((totalAmount * percentage) / 100) * 100) / 100;
      splits.push(new Split({ userId, amount }));
    }

    // 3. 處理餘數，補在第一個人身上
    const totalCurrent = splits.reduce((sum, s) => sum + s.amount, 0);
    const remainder = Math.round((totalAmount - totalCurrent) * 100) / 100;

    if (remainder !== 0 && splits.length > 0) {
      const firstSplit = splits[0];
      if (firstSplit) {
        splits[0] = firstSplit.adjustAmount(firstSplit.amount + remainder);
      }
    }

    return Result.ok<Split[]>(splits);
  }
}
