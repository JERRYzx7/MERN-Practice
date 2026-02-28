import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { User } from "@domain/entities/User.js";
import { UserModel } from "./UserSchema.js";

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async save(user: User): Promise<void> {
    await UserModel.findByIdAndUpdate(
      user.id,
      {
        _id: user.id,
        name: user.name,
        email: user.email,
        personalGroupId: user.personalGroupId,
        passwordHash: user.passwordHash ?? null,
        avatarUrl: user.avatarUrl ?? null,
        oauthProvider: user.oauthProvider ?? null,
        oauthId: user.oauthId ?? null,
        customCategories: user.customCategories,
      },
      { upsert: true, new: true },
    );
  }

  async findByIds(ids: string[]): Promise<User[]> {
    const docs = await UserModel.find({ _id: { $in: ids } }).lean();
    return docs.map((d) => this.toDomain(d));
  }

  private toDomain(doc: {
    _id: string;
    name: string;
    email: string;
    personalGroupId?: string;
    passwordHash?: string | null;
    avatarUrl?: string | null;
    oauthProvider?: string | null;
    oauthId?: string | null;
    customCategories?: { expense: string[]; income: string[] };
  }): User {
    const result = User.create(
      {
        name: doc.name,
        email: doc.email,
        ...(doc.personalGroupId !== undefined ? { personalGroupId: doc.personalGroupId } : {}),
        ...(doc.passwordHash !== undefined ? { passwordHash: doc.passwordHash } : {}),
        ...(doc.avatarUrl !== undefined ? { avatarUrl: doc.avatarUrl } : {}),
        ...(doc.oauthProvider !== undefined ? { oauthProvider: doc.oauthProvider } : {}),
        ...(doc.oauthId !== undefined ? { oauthId: doc.oauthId } : {}),
        ...(doc.customCategories !== undefined ? { customCategories: doc.customCategories } : {}),
      },
      doc._id,
    );
    if (result.isFailure) throw new Error(`User mapping failed: ${result.error}`);
    return result.getValue();
  }
}
