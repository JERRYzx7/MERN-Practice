import { Entity } from "@shared/core/Entity.js";
import { Result } from "@shared/core/Result.js";
import { Split } from "./Split.js";

interface ExpenseProps {
  description: string;
  amount: number;
  payerId: string;
  groupId: string;
  splits: Split[];
  date?: Date;
}

export class Expense extends Entity<ExpenseProps> {
  get amount(): number {
    return this.props.amount;
  }
  get splits(): Split[] {
    return this.props.splits;
  }
  private constructor(props: ExpenseProps, id?: string) {
    super(props, id);
  }
  public static create(props: ExpenseProps, id?: string): Result<Expense> {
    // 1. 基本驗證
    if (!props.description || props.description.trim().length === 0) {
      return Result.fail<Expense>("支出描述不能為空");
    }

    if (props.amount <= 0) {
      return Result.fail<Expense>("支出金額必須大於 0");
    }

    if (props.splits.length === 0) {
      return Result.fail<Expense>("至少需要有一個分攤對象");
    }

    // 2. 核心邏輯驗證：分攤總額必須等於總金額
    // 使用 reduce 加總所有分攤金額
    const totalSplitAmount = props.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );

    // 處理浮點數誤差 (常見於金額計算，取到小數點後兩位比較)
    if (Math.abs(totalSplitAmount - props.amount) > 0.011) {
      return Result.fail<Expense>(
        `金額不符：總額為 ${props.amount}，但分攤總計為 ${totalSplitAmount}`
      );
    }

    return Result.ok<Expense>(new Expense(props, id));
  }
}
