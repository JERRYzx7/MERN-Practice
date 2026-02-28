import mongoose from "mongoose";

const DEFAULT_URI = "mongodb://localhost:27017/splitwise";

export async function connectDatabase(uri?: string): Promise<void> {
  const connectionUri = uri ?? process.env["MONGODB_URI"] ?? DEFAULT_URI;
  await mongoose.connect(connectionUri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
