import { Result } from "@shared/core/Result.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";

interface JoinByInviteRequest {
  inviteCode: string;
  userId: string;
}

interface JoinByInviteResponse {
  groupId: string;
}

export class JoinByInviteUseCase {
  constructor(private groupRepo: IGroupRepository) {}

  async execute(
    req: JoinByInviteRequest
  ): Promise<Result<JoinByInviteResponse>> {
    const group = await this.groupRepo.findByInviteCode(req.inviteCode);

    if (!group) {
      return Result.fail<JoinByInviteResponse>("無效的邀請連結");
    }

    const acceptResult = group.acceptInvite(req.inviteCode, req.userId);

    if (acceptResult.isFailure) {
      return Result.fail<JoinByInviteResponse>(acceptResult.error!);
    }

    await this.groupRepo.save(group);

    return Result.ok<JoinByInviteResponse>({ groupId: group.id! });
  }
}
