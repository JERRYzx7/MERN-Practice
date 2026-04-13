import { Result } from "@shared/core/Result.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";

interface RemoveGroupMemberRequest {
  groupId: string;
  requesterId: string;
  targetMemberId: string;
}

interface RemoveGroupMemberResponse {
  groupId: string;
  deletedGroup: boolean;
  ownerId?: string;
  memberIds?: string[];
}

export class RemoveGroupMemberUseCase {
  constructor(
    private readonly groupRepo: IGroupRepository,
    private readonly expenseRepo: IExpenseRepository,
  ) {}

  async execute(
    request: RemoveGroupMemberRequest,
  ): Promise<Result<RemoveGroupMemberResponse>> {
    const group = await this.groupRepo.findById(request.groupId);
    if (!group) return Result.fail("找不到該群組");

    const removeResult = group.removeMember(
      request.requesterId,
      request.targetMemberId,
    );
    if (removeResult.isFailure) return Result.fail(removeResult.error!);

    const { groupDeleted } = removeResult.getValue();

    if (groupDeleted) {
      await this.expenseRepo.deleteByGroupId(request.groupId);
      await this.groupRepo.deleteById(request.groupId);
      return Result.ok({
        groupId: request.groupId,
        deletedGroup: true,
      });
    }

    await this.groupRepo.save(group);
    return Result.ok({
      groupId: request.groupId,
      deletedGroup: false,
      ownerId: group.ownerId,
      memberIds: group.memberIds,
    });
  }
}

