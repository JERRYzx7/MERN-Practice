import { beforeEach, describe, expect, it, vi } from "vitest";
import { Group, GroupType } from "@domain/entities/Group.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import { RemoveGroupMemberUseCase } from "./RemoveGroupMemberUseCase.js";

describe("RemoveGroupMemberUseCase", () => {
  let groupRepo: IGroupRepository;
  let expenseRepo: IExpenseRepository;
  let useCase: RemoveGroupMemberUseCase;

  beforeEach(() => {
    groupRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByInviteCode: vi.fn(),
      isUserInGroup: vi.fn(),
      save: vi.fn(),
      deleteById: vi.fn(),
    };
    expenseRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByGroupId: vi.fn(),
      deleteByGroupId: vi.fn(),
    };
    useCase = new RemoveGroupMemberUseCase(groupRepo, expenseRepo);
  });

  it("owner 可移除其他成員", async () => {
    const group = Group.create({
      name: "Trip",
      type: GroupType.TEAM,
      ownerId: "owner-1",
      memberIds: ["owner-1", "member-2"],
    }).getValue();
    vi.mocked(groupRepo.findById).mockResolvedValue(group);
    vi.mocked(groupRepo.save).mockResolvedValue();

    const result = await useCase.execute({
      groupId: group.id,
      requesterId: "owner-1",
      targetMemberId: "member-2",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().deletedGroup).toBe(false);
    expect(result.getValue().memberIds).toEqual(["owner-1"]);
    expect(groupRepo.save).toHaveBeenCalledWith(group);
    expect(groupRepo.deleteById).not.toHaveBeenCalled();
  });

  it("owner 最後一人離開時刪除群組與相關支出", async () => {
    const group = Group.create({
      name: "Solo",
      type: GroupType.TEAM,
      ownerId: "owner-1",
      memberIds: ["owner-1"],
    }).getValue();
    vi.mocked(groupRepo.findById).mockResolvedValue(group);
    vi.mocked(groupRepo.deleteById).mockResolvedValue();
    vi.mocked(expenseRepo.deleteByGroupId).mockResolvedValue();

    const result = await useCase.execute({
      groupId: group.id,
      requesterId: "owner-1",
      targetMemberId: "owner-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({
      groupId: group.id,
      deletedGroup: true,
    });
    expect(expenseRepo.deleteByGroupId).toHaveBeenCalledWith(group.id);
    expect(groupRepo.deleteById).toHaveBeenCalledWith(group.id);
    expect(groupRepo.save).not.toHaveBeenCalled();
  });

  it("非 owner 不能移除其他人", async () => {
    const group = Group.create({
      name: "Trip",
      type: GroupType.TEAM,
      ownerId: "owner-1",
      memberIds: ["owner-1", "member-2", "member-3"],
    }).getValue();
    vi.mocked(groupRepo.findById).mockResolvedValue(group);

    const result = await useCase.execute({
      groupId: group.id,
      requesterId: "member-2",
      targetMemberId: "member-3",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("只有擁有者可以移除其他成員");
  });
});

