import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetBalanceUseCase } from "./GetBalanceUseCase.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { Expense } from "@domain/entities/Expense.js";
import { Split } from "@domain/entities/Split.js";
import { Group, GroupType } from "@domain/entities/Group.js";

function makeExpense(
  amount: number,
  payerId: string,
  splits: { userId: string; amount: number }[],
  groupId = "group-1",
): Expense {
  return Expense.create({
    description: "test",
    amount,
    currency: "TWD",
    payerId,
    groupId,
    splits: splits.map((s) => new Split(s)),
  }).getValue();
}

describe("GetBalanceUseCase", () => {
  let useCase: GetBalanceUseCase;
  let mockGroupRepo: IGroupRepository;
  let mockExpenseRepo: IExpenseRepository;

  beforeEach(() => {
    mockGroupRepo = {
      findById: vi.fn(),
      isUserInGroup: vi.fn(),
      save: vi.fn(),
    };
    mockExpenseRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByGroupId: vi.fn(),
    };
    useCase = new GetBalanceUseCase(mockGroupRepo, mockExpenseRepo);
  });

  it("當群組不存在時應回傳失敗", async () => {
    vi.mocked(mockGroupRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute({ groupId: "no-group" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("找不到該群組");
  });

  it("群組無支出時應回傳空結餘", async () => {
    const group = Group.create({
      name: "test",
      type: GroupType.TEAM,
      ownerId: "alice",
      memberIds: ["alice", "bob"],
    }).getValue();
    vi.mocked(mockGroupRepo.findById).mockResolvedValue(group);
    vi.mocked(mockExpenseRepo.findByGroupId).mockResolvedValue([]);

    const result = await useCase.execute({ groupId: "group-1" });

    expect(result.isSuccess).toBe(true);
    const balance = result.getValue();
    expect(balance.settlements).toHaveLength(0);
    expect(balance.descriptions).toHaveLength(0);
  });

  it("2 人 1 筆帳：正確計算結餘與結算清單", async () => {
    const group = Group.create({
      name: "test",
      type: GroupType.TEAM,
      ownerId: "alice",
      memberIds: ["alice", "bob"],
    }).getValue();
    vi.mocked(mockGroupRepo.findById).mockResolvedValue(group);

    const expense = makeExpense(100, "alice", [
      { userId: "alice", amount: 50 },
      { userId: "bob", amount: 50 },
    ]);
    vi.mocked(mockExpenseRepo.findByGroupId).mockResolvedValue([expense]);

    const result = await useCase.execute({ groupId: "group-1" });

    expect(result.isSuccess).toBe(true);
    const balance = result.getValue();
    expect(balance.netBalances["alice"]).toBe(50);
    expect(balance.netBalances["bob"]).toBe(-50);
    expect(balance.settlements).toHaveLength(1);
    expect(balance.settlements[0]).toEqual({
      from: "bob",
      to: "alice",
      amount: 50,
    });
    expect(balance.descriptions[0]).toBe("bob 應付給 alice $50.00");
  });

  it("3 人多筆帳：合併計算最少轉帳", async () => {
    const group = Group.create({
      name: "test",
      type: GroupType.TEAM,
      ownerId: "alice",
      memberIds: ["alice", "bob", "charlie"],
    }).getValue();
    vi.mocked(mockGroupRepo.findById).mockResolvedValue(group);

    const e1 = makeExpense(90, "alice", [
      { userId: "alice", amount: 30 },
      { userId: "bob", amount: 30 },
      { userId: "charlie", amount: 30 },
    ]);
    const e2 = makeExpense(60, "bob", [
      { userId: "bob", amount: 30 },
      { userId: "charlie", amount: 30 },
    ]);
    vi.mocked(mockExpenseRepo.findByGroupId).mockResolvedValue([e1, e2]);

    const result = await useCase.execute({ groupId: "group-1" });

    expect(result.isSuccess).toBe(true);
    const balance = result.getValue();
    // alice +60, bob 0, charlie -60 → 1 筆結算
    expect(balance.settlements).toHaveLength(1);
    expect(balance.settlements[0]).toEqual({
      from: "charlie",
      to: "alice",
      amount: 60,
    });
  });
});
