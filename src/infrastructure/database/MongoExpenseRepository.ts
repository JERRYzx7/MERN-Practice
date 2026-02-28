import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import { Expense } from "@domain/entities/Expense.js";
import { Split } from "@domain/entities/Split.js";
import { Payment } from "@domain/entities/Payment.js";
import { ExpenseModel } from "./ExpenseSchema.js";

export class MongoExpenseRepository implements IExpenseRepository {
  async save(expense: Expense): Promise<void> {
    await ExpenseModel.findByIdAndUpdate(
      expense.id,
      {
        _id: expense.id,
        description: expense.props.description,
        currency: expense.props.currency,
        groupId: expense.props.groupId,
        payments: expense.payments.map((p) => ({
          userId: p.userId,
          amount: p.amount,
          ...(p.note !== undefined ? { note: p.note } : {}),
        })),
        splits: expense.splits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
        date: expense.props.date ?? new Date(),
        category: expense.category,
      },
      { upsert: true, new: true },
    );
  }

  async findById(id: string): Promise<Expense | null> {
    const doc = await ExpenseModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByGroupId(groupId: string): Promise<Expense[]> {
    const docs = await ExpenseModel.find({ groupId }).lean();
    const results: Expense[] = [];
    for (const d of docs) {
      try {
        results.push(this.toDomain(d));
      } catch {
        // skip legacy/malformed documents
      }
    }
    return results;
  }

  private toDomain(doc: {
    _id: string;
    description: string;
    currency: string;
    groupId: string;
    payments: Array<{ userId: string; amount: number; note?: string }>;
    splits: Array<{ userId: string; amount: number }>;
    date: Date;
    category?: string;
  }): Expense {
    const payments = (doc.payments ?? []).map(
      (p) =>
        new Payment({
          userId: p.userId,
          amount: p.amount,
          ...(p.note !== undefined ? { note: p.note } : {}),
        }),
    );
    const splits = (doc.splits ?? []).map(
      (s) => new Split({ userId: s.userId, amount: s.amount }),
    );
    const result = Expense.create(
      {
        description: doc.description,
        currency: doc.currency,
        groupId: doc.groupId,
        payments,
        splits,
        date: doc.date,
        category: doc.category ?? "",
      },
      doc._id,
    );
    if (result.isFailure)
      throw new Error(`Expense mapping failed: ${result.error}`);
    return result.getValue();
  }
}
