import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { Group, GroupType } from "@domain/entities/Group.js";
import { GroupModel } from "./GroupSchema.js";

export class MongoGroupRepository implements IGroupRepository {
  async findById(id: string): Promise<Group | null> {
    const doc = await GroupModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc._id, doc.name, doc.type, doc.ownerId, doc.memberIds);
  }

  async findByUserId(userId: string): Promise<Group[]> {
    const docs = await GroupModel.find({ memberIds: userId }).lean();
    return docs.map((doc) =>
      this.toDomain(doc._id, doc.name, doc.type, doc.ownerId, doc.memberIds),
    );
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
      },
      { upsert: true, new: true },
    );
  }

  private toDomain(
    id: string,
    name: string,
    type: "Personal" | "Team",
    ownerId: string,
    memberIds: string[],
  ): Group {
    const result = Group.create(
      { name, type: type as GroupType, ownerId, memberIds },
      id,
    );
    if (result.isFailure) throw new Error(`Group mapping failed: ${result.error}`);
    return result.getValue();
  }
}
