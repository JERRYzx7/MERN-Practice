import { Result } from "@shared/core/Result.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { randomUUID } from "crypto";

interface CreateInviteRequest {
  groupId: string;
  creatorId: string;
}

interface CreateInviteResponse {
  inviteCode: string;
}

export class CreateInviteUseCase {
  constructor(private groupRepo: IGroupRepository) {}

  async execute(
    req: CreateInviteRequest
  ): Promise<Result<CreateInviteResponse>> {
    const group = await this.groupRepo.findById(req.groupId);

    if (!group) {
      return Result.fail<CreateInviteResponse>("群組不存在");
    }

    const inviteCode = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天後

    const addResult = group.addInviteToken(inviteCode, expiresAt, req.creatorId);

    if (addResult.isFailure) {
      return Result.fail<CreateInviteResponse>(addResult.error!);
    }

    await this.groupRepo.save(group);

    return Result.ok<CreateInviteResponse>({ inviteCode });
  }
}
