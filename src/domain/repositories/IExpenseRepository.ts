import { Expense } from "@domain/entities/Expense.js";

export interface IExpenseRepository {
  save(expense: Expense): Promise<void>;
  findById(id: string): Promise<Expense | null>;
  findByGroupId(groupId: string): Promise<Expense[]>;
}
