import { Group } from "@domain/entities/Group.js";

export interface IGroupRepository {
  findById(id: string): Promise<Group | null>;
  isUserInGroup(userId: string, groupId: string): Promise<boolean>;
  save(group: Group): Promise<void>;
}
