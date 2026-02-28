import mongoose, { Schema, type Document } from "mongoose";

export interface IUserDocument extends Document<string> {
  _id: string;
  name: string;
  email: string;
  personalGroupId?: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  oauthProvider?: string | null;
  oauthId?: string | null;
  customCategories?: { expense: string[]; income: string[] };
}

const UserSchema = new Schema<IUserDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    personalGroupId: { type: String },
    passwordHash: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    oauthProvider: { type: String, default: null },
    oauthId: { type: String, default: null },
    customCategories: {
      type: {
        expense: { type: [String], default: [] },
        income: { type: [String], default: [] },
      },
      default: () => ({ expense: [], income: [] }),
    },
  },
  { _id: false, timestamps: true },
);

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
