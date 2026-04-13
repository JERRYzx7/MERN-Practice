import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { Group, GroupType, type InviteToken } from "@domain/entities/Group.js";
import { GroupModel, type IGroupDocument } from "./GroupSchema.js";

export class MongoGroupRepository implements IGroupRepository {
  async findById(id: string): Promise<Group | null> {
    const doc = await GroupModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc as unknown as IGroupDocument);
  }

  async findByUserId(userId: string): Promise<Group[]> {
    const docs = await GroupModel.find({ memberIds: userId }).lean();
    return docs.map((doc) => this.toDomain(doc as unknown as IGroupDocument));
  }

  async findByInviteCode(inviteCode: string): Promise<Group | null> {
    const doc = await GroupModel.findOne({
      "inviteTokens.code": inviteCode,
    }).lean();
    if (!doc) return null;
    return this.toDomain(doc as unknown as IGroupDocument);
  }

  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    const count = await GroupModel.countDocuments({
      _id: groupId,
      memberIds: userId,
    });
    return count > 0;
  }

  async save(group: Group): Promise<void> {
    await GroupModel.findByIdAndUpdate(
      group.id,
      {
        _id: group.id,
        name: group.name,
        type: group.type,
        ownerId: group.ownerId,
        memberIds: group.memberIds,
        inviteTokens: group.inviteTokens ?? [],
      },
      { upsert: true, new: true },
    );
  }

  async deleteById(id: string): Promise<void> {
    await GroupModel.findByIdAndDelete(id);
  }

  private toDomain(doc: IGroupDocument): Group {
    const result = Group.create(
      {
        name: doc.name,
        type: doc.type as GroupType,
        ownerId: doc.ownerId,
        memberIds: doc.memberIds,
        inviteTokens: doc.inviteTokens ?? [],
      },
      doc._id,
    );
    if (result.isFailure) throw new Error(`Group mapping failed: ${result.error}`);
    return result.getValue();
  }
}
