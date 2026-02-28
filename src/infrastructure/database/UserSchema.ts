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
  },
  { _id: false, timestamps: true },
);

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
