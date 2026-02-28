import { Result } from "@shared/core/Result.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";

export interface MemberDTO {
  id: string;
  name: string;
  avatarUrl?: string;
}

export class GetGroupMembersUseCase {
  constructor(
    private groupRepo: IGroupRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(groupId: string): Promise<Result<MemberDTO[]>> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) return Result.fail("找不到該群組");

    const users = await this.userRepo.findByIds(group.memberIds);
    const dtos: MemberDTO[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
    }));

    return Result.ok(dtos);
  }
}
