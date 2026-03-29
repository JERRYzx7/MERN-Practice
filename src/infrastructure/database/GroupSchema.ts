import mongoose, { Schema, type Document } from "mongoose";

export interface IGroupDocument extends Document<string> {
  _id: string;
  name: string;
  type: "Personal" | "Team";
  ownerId: string;
  memberIds: string[];
  inviteTokens?: Array<{
    code: string;
    expiresAt: Date;
    createdBy: string;
  }>;
}

const GroupSchema = new Schema<IGroupDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Personal", "Team"], required: true },
    ownerId: { type: String, required: true },
    memberIds: [{ type: String }],
    inviteTokens: [
      {
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdBy: { type: String, required: true },
      },
    ],
  },
  { _id: false, timestamps: true },
);

export const GroupModel = mongoose.model<IGroupDocument>("Group", GroupSchema);
