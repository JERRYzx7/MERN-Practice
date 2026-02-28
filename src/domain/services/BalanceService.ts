import { Expense } from "@domain/entities/Expense.js";

export interface Settlement {
  from: string; // 欠錢者 userId
  to: string; // 被欠者 userId
  amount: number;
}

export interface BalanceResult {
  netBalances: Record<string, number>; // 正數 = 被欠，負數 = 欠人
  settlements: Settlement[]; // 最佳化轉帳清單
  descriptions: string[]; // 可讀描述
}

export class BalanceService {
  private static readonly TOLERANCE = 0.011;

  /**
   * 計算多筆 Expense 的群組結餘
   * @param expenses 群組內的所有支出
   */
  public static calculate(expenses: Expense[]): BalanceResult {
    const netBalances = BalanceService.calculateNetBalances(expenses);
    const settlements = BalanceService.simplifyDebts(netBalances);
    const descriptions = BalanceService.generateDescriptions(settlements);
    return { netBalances, settlements, descriptions };
  }

  /**
   * Step 1：計算每位成員的淨餘額
   * payer += expense.amount, split.userId -= split.amount
   */
  public static calculateNetBalances(
    expenses: Expense[],
  ): Record<string, number> {
    const balances: Record<string, number> = {};

    for (const expense of expenses) {
      // 每個付款人依其付款金額獲得債權
      for (const payment of expense.payments) {
        balances[payment.userId] = (balances[payment.userId] ?? 0) + payment.amount;
      }

      // 分攤者欠錢，餘額減少
      for (const split of expense.splits) {
        balances[split.userId] =
          (balances[split.userId] ?? 0) - split.amount;
      }
    }

    // 四捨五入到分，避免浮點數累積誤差
    for (const userId of Object.keys(balances)) {
      balances[userId] = Math.round((balances[userId] ?? 0) * 100) / 100;
    }

    return balances;
  }

  /**
   * Step 2：貪婪債務簡化演算法，最小化轉帳次數
   */
  public static simplifyDebts(
    netBalances: Record<string, number>,
  ): Settlement[] {
    const settlements: Settlement[] = [];

    // 分出債權人（正）與債務人（負）
    const creditors: { userId: string; amount: number }[] = [];
    const debtors: { userId: string; amount: number }[] = [];

    for (const [userId, balance] of Object.entries(netBalances)) {
      if (balance > BalanceService.TOLERANCE) {
        creditors.push({ userId, amount: balance });
      } else if (balance < -BalanceService.TOLERANCE) {
        debtors.push({ userId, amount: balance });
      }
    }

    // 降序排列（最大優先）
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount); // 最負的在前

    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
      const creditor = creditors[ci]!;
      const debtor = debtors[di]!;

      const settleAmount =
        Math.round(Math.min(creditor.amount, Math.abs(debtor.amount)) * 100) /
        100;

      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: settleAmount,
      });

      creditor.amount =
        Math.round((creditor.amount - settleAmount) * 100) / 100;
      debtor.amount = Math.round((debtor.amount + settleAmount) * 100) / 100;

      if (Math.abs(creditor.amount) <= BalanceService.TOLERANCE) ci++;
      if (Math.abs(debtor.amount) <= BalanceService.TOLERANCE) di++;
    }

    return settlements;
  }

  /**
   * Step 3：將 Settlement 轉為人可讀描述
   */
  public static generateDescriptions(settlements: Settlement[]): string[] {
    return settlements.map(
      (s) =>
        `${s.from} 應付給 ${s.to} $${s.amount.toFixed(2)}`,
    );
  }
}
