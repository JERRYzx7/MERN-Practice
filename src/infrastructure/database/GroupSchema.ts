import mongoose, { Schema, type Document } from "mongoose";

export interface IGroupDocument extends Document {
  _id: string;
  name: string;
  type: "Personal" | "Team";
  ownerId: string;
  memberIds: string[];
}

const GroupSchema = new Schema<IGroupDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Personal", "Team"], required: true },
    ownerId: { type: String, required: true },
    memberIds: [{ type: String }],
  },
  { _id: false, timestamps: true },
);

export const GroupModel = mongoose.model<IGroupDocument>("Group", GroupSchema);
