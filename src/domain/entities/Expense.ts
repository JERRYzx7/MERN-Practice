import { Entity } from "@shared/core/Entity.js";
import { Result } from "@shared/core/Result.js";
import { Split } from "./Split.js";
import { Payment } from "./Payment.js";

interface ExpenseProps {
  description: string;
  currency: string;
  groupId: string;
  payments: Payment[];
  splits: Split[];
  date?: Date;
  category?: string;
  type?: "EXPENSE" | "INCOME";
}

export class Expense extends Entity<ExpenseProps> {
  get description(): string {
    return this.props.description;
  }
  get groupId(): string {
    return this.props.groupId;
  }
  /** Total paid — derived from sum of payments */
  get amount(): number {
    return Math.round(
      this.props.payments.reduce((sum, p) => sum + p.amount, 0) * 100,
    ) / 100;
  }
  get currency(): string {
    return this.props.currency;
  }
  /** First payer — convenience getter for display */
  get payerId(): string {
    return this.props.payments[0]?.userId ?? "";
  }
  get payments(): Payment[] {
    return this.props.payments;
  }
  get splits(): Split[] {
    return this.props.splits;
  }
  get date(): Date | undefined {
    return this.props.date;
  }
  get category(): string {
    return this.props.category ?? "";
  }
  get type(): "EXPENSE" | "INCOME" {
    return this.props.type ?? "EXPENSE";
  }
  private constructor(props: ExpenseProps, id?: string) {
    super(props, id);
  }
  public static create(props: ExpenseProps, id?: string): Result<Expense> {
    if (!props.description || props.description.trim().length === 0) {
      return Result.fail<Expense>("支出描述不能為空");
    }

    if (props.payments.length === 0) {
      return Result.fail<Expense>("至少需要有一個付款項目");
    }

    const totalPaid = props.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid <= 0) {
      return Result.fail<Expense>("支出金額必須大於 0");
    }

    if (props.splits.length === 0) {
      return Result.fail<Expense>("至少需要有一個分攤對象");
    }

    const totalSplit = props.splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - totalPaid) > 0.011) {
      return Result.fail<Expense>(
        `金額不符：總額為 ${totalPaid}，但分攤總計為 ${totalSplit}`,
      );
    }

    return Result.ok<Expense>(new Expense(props, id));
  }
}

