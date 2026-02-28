import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import { Expense } from "@domain/entities/Expense.js";
import { Split } from "@domain/entities/Split.js";
import { ExpenseModel } from "./ExpenseSchema.js";

export class MongoExpenseRepository implements IExpenseRepository {
  async save(expense: Expense): Promise<void> {
    await ExpenseModel.findByIdAndUpdate(
      expense.id,
      {
        _id: expense.id,
        description: expense.props.description,
        amount: expense.amount,
        payerId: expense.payerId,
        groupId: expense.props.groupId,
        splits: expense.splits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
        date: expense.props.date ?? new Date(),
      },
      { upsert: true, new: true },
    );
  }

  async findById(id: string): Promise<Expense | null> {
    const doc = await ExpenseModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(
      doc._id,
      doc.description,
      doc.amount,
      doc.payerId,
      doc.groupId,
      doc.splits,
      doc.date,
    );
  }

  async findByGroupId(groupId: string): Promise<Expense[]> {
    const docs = await ExpenseModel.find({ groupId }).lean();
    return docs.map((d) =>
      this.toDomain(
        d._id,
        d.description,
        d.amount,
        d.payerId,
        d.groupId,
        d.splits,
        d.date,
      ),
    );
  }

  private toDomain(
    id: string,
    description: string,
    amount: number,
    payerId: string,
    groupId: string,
    splits: Array<{ userId: string; amount: number }>,
    date: Date,
  ): Expense {
    const splitEntities = splits.map(
      (s) => new Split({ userId: s.userId, amount: s.amount }),
    );
    const result = Expense.create(
      { description, amount, payerId, groupId, splits: splitEntities, date },
      id,
    );
    if (result.isFailure)
      throw new Error(`Expense mapping failed: ${result.error}`);
    return result.getValue();
  }
}
