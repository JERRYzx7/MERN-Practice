import { Group } from "@domain/entities/Group.js";

export interface IGroupRepository {
  findById(id: string): Promise<Group | null>;
  // 用於驗證使用者是否在群組中
  isUserInGroup(userId: string, groupId: string): Promise<boolean>;
}
