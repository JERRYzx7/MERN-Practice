import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateInviteUseCase } from "./CreateInviteUseCase.js";
import { Group, GroupType } from "@domain/entities/Group.js";
import { Result } from "@shared/core/Result.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";

describe("CreateInviteUseCase（建立邀請連結用例測試）", () => {
  let mockGroupRepo: IGroupRepository;
  let useCase: CreateInviteUseCase;

  beforeEach(() => {
    mockGroupRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByInviteCode: vi.fn(),
      isUserInGroup: vi.fn(),
      deleteById: vi.fn(),
    };
    useCase = new CreateInviteUseCase(mockGroupRepo);
  });

  it("應該成功為 TEAM 群組建立邀請 token", async () => {
    const mockGroup = Group.create({
      name: "室友分帳",
      type: GroupType.TEAM,
      ownerId: "owner-123",
      memberIds: ["owner-123"],
    }).getValue();

    vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
    vi.mocked(mockGroupRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      groupId: "group-456",
      creatorId: "owner-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveProperty("inviteCode");
    expect(result.getValue().inviteCode).toMatch(/^[a-z0-9-]{36}$/); // UUID format
    expect(mockGroupRepo.save).toHaveBeenCalledWith(mockGroup);
  });

  it("群組不存在時應該返回失敗", async () => {
    vi.mocked(mockGroupRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute({
      groupId: "non-existent",
      creatorId: "owner-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("群組不存在");
  });

  it("PERSONAL 群組應該無法建立邀請連結", async () => {
    const mockPersonalGroup = Group.create({
      name: "個人空間",
      type: GroupType.PERSONAL,
      ownerId: "owner-123",
      memberIds: ["owner-123"],
    }).getValue();

    vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockPersonalGroup);

    const result = await useCase.execute({
      groupId: "personal-group",
      creatorId: "owner-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("個人群組不能產生邀請連結");
  });
});
