import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { User } from "@domain/entities/User.js";
import { UserModel } from "./UserSchema.js";

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc._id, doc.name, doc.email, doc.personalGroupId);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).lean();
    if (!doc) return null;
    return this.toDomain(doc._id, doc.name, doc.email, doc.personalGroupId);
  }

  async save(user: User): Promise<void> {
    await UserModel.findByIdAndUpdate(
      user.id,
      {
        _id: user.id,
        name: user.name,
        email: user.email,
        personalGroupId: user.personalGroupId,
      },
      { upsert: true, new: true },
    );
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const docs = await UserModel.find({ _id: { $in: ids } }).lean();
    return docs.map((d) =>
      this.toDomain(d._id, d.name, d.email, d.personalGroupId),
    );
  }

  private toDomain(
    id: string,
    name: string,
    email: string,
    personalGroupId?: string,
  ): User {
    const result = User.create(
      {
        name,
        email,
        ...(personalGroupId !== undefined ? { personalGroupId } : {}),
      },
      id,
    );
    if (result.isFailure) throw new Error(`User mapping failed: ${result.error}`);
    return result.getValue();
  }
}
