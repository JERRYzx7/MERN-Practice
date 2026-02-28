import mongoose, { Schema, type Document } from "mongoose";

export interface IUserDocument extends Document {
  _id: string;
  name: string;
  email: string;
  personalGroupId?: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    personalGroupId: { type: String },
  },
  { _id: false, timestamps: true },
);

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
