import { Result } from "@shared/core/Result.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import type { GroupType } from "@domain/entities/Group.js";

export interface GroupDTO {
  id: string;
  name: string;
  type: GroupType;
  ownerId: string;
  memberIds: string[];
}

export class GetGroupsUseCase {
  constructor(private groupRepo: IGroupRepository) {}

  async execute(userId: string): Promise<Result<GroupDTO[]>> {
    const groups = await this.groupRepo.findByUserId(userId);
    const dtos: GroupDTO[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      ownerId: g.ownerId,
      memberIds: g.memberIds,
    }));
    return Result.ok(dtos);
  }
}
