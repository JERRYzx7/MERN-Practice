import mongoose, { Schema, type Document } from "mongoose";

interface IPaymentSubDoc {
  userId: string;
  amount: number;
  note?: string;
}

interface ISplitSubDoc {
  userId: string;
  amount: number;
}

export interface IExpenseDocument extends Document<string> {
  _id: string;
  description: string;
  currency: string;
  groupId: string;
  payments: IPaymentSubDoc[];
  splits: ISplitSubDoc[];
  date: Date;
  category: string;
  type: string;
}

const PaymentSubSchema = new Schema<IPaymentSubDoc>(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String },
  },
  { _id: false },
);

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
    currency: { type: String, required: true, default: "TWD" },
    groupId: { type: String, required: true, index: true },
    payments: [PaymentSubSchema],
    splits: [SplitSubSchema],
    date: { type: Date, required: true },
    category: { type: String, default: "" },
    type: { type: String, default: "EXPENSE" },
  },
  { _id: false, timestamps: true },
);

export const ExpenseModel = mongoose.model<IExpenseDocument>(
  "Expense",
  ExpenseSchema,
);
