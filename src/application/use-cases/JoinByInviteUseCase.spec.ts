import { describe, it, expect, vi, beforeEach } from "vitest";
import { JoinByInviteUseCase } from "./JoinByInviteUseCase.js";
import { Group, GroupType } from "@domain/entities/Group.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";

describe("JoinByInviteUseCase（透過邀請加入群組用例測試）", () => {
  let mockGroupRepo: IGroupRepository;
  let useCase: JoinByInviteUseCase;

  beforeEach(() => {
    mockGroupRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByInviteCode: vi.fn(),
      isUserInGroup: vi.fn(),
    };
    useCase = new JoinByInviteUseCase(mockGroupRepo);
  });

  it("應該成功透過有效邀請 token 加入群組", async () => {
    const mockGroup = Group.create({
      name: "室友分帳",
      type: GroupType.TEAM,
      ownerId: "owner-123",
      memberIds: ["owner-123"],
    }).getValue();

    const inviteCode = "valid-code-abc";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    mockGroup.addInviteToken(inviteCode, expiresAt, "owner-123");

    vi.mocked(mockGroupRepo.findByInviteCode).mockResolvedValue(mockGroup);
    vi.mocked(mockGroupRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      inviteCode,
      userId: "new-user-456",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({ groupId: mockGroup.id });
    expect(mockGroup.memberIds).toContain("new-user-456");
    expect(mockGroupRepo.save).toHaveBeenCalledWith(mockGroup);
  });

  it("無效的邀請 code 應該返回失敗", async () => {
    vi.mocked(mockGroupRepo.findByInviteCode).mockResolvedValue(null);

    const result = await useCase.execute({
      inviteCode: "invalid-code",
      userId: "user-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("無效的邀請連結");
  });

  it("過期的邀請 token 應該被拒絕", async () => {
    const mockGroup = Group.create({
      name: "室友分帳",
      type: GroupType.TEAM,
      ownerId: "owner-123",
      memberIds: ["owner-123"],
    }).getValue();

    const inviteCode = "expired-code";
    const expiresAt = new Date(Date.now() - 1000); // 已過期
    mockGroup.addInviteToken(inviteCode, expiresAt, "owner-123");

    vi.mocked(mockGroupRepo.findByInviteCode).mockResolvedValue(mockGroup);

    const result = await useCase.execute({
      inviteCode,
      userId: "user-456",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("邀請連結已過期");
  });

  it("已經是成員的使用者應該無法重複加入", async () => {
    const mockGroup = Group.create({
      name: "室友分帳",
      type: GroupType.TEAM,
      ownerId: "owner-123",
      memberIds: ["owner-123"],
    }).getValue();

    const inviteCode = "code-123";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    mockGroup.addInviteToken(inviteCode, expiresAt, "owner-123");

    vi.mocked(mockGroupRepo.findByInviteCode).mockResolvedValue(mockGroup);

    const result = await useCase.execute({
      inviteCode,
      userId: "owner-123", // 擁有者嘗試加入
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("您已經是群組成員");
  });
});
