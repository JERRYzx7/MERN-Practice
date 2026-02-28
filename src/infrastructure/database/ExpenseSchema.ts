import mongoose, { Schema, type Document } from "mongoose";

interface ISplitSubDoc {
  userId: string;
  amount: number;
}

export interface IExpenseDocument extends Document {
  _id: string;
  description: string;
  amount: number;
  payerId: string;
  groupId: string;
  splits: ISplitSubDoc[];
  date: Date;
}

const SplitSubSchema = new Schema<ISplitSubDoc>(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false },
);

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    _id: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    payerId: { type: String, required: true },
    groupId: { type: String, required: true, index: true },
    splits: [SplitSubSchema],
    date: { type: Date, required: true },
  },
  { _id: false, timestamps: true },
);

export const ExpenseModel = mongoose.model<IExpenseDocument>(
  "Expense",
  ExpenseSchema,
);
