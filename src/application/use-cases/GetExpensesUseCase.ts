import { Result } from "@shared/core/Result.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";

export interface PaymentDTO {
  userId: string;
  amount: number;
  note?: string;
}

export interface ExpenseDTO {
  id: string;
  groupId: string;
  payments: PaymentDTO[];
  amount: number;
  currency: string;
  description: string;
  splits: { userId: string; amount: number }[];
}

export class GetExpensesUseCase {
  constructor(private expenseRepo: IExpenseRepository) {}

  async execute(groupId: string): Promise<Result<ExpenseDTO[]>> {
    const expenses = await this.expenseRepo.findByGroupId(groupId);
    const dtos: ExpenseDTO[] = expenses.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      payments: e.payments.map((p) => ({
        userId: p.userId,
        amount: p.amount,
        ...(p.note !== undefined ? { note: p.note } : {}),
      })),
      amount: e.amount,
      currency: e.currency,
      description: e.description,
      splits: e.splits,
    }));
    return Result.ok(dtos);
  }
}
