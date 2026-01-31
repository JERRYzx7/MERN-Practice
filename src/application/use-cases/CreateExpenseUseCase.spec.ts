import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateExpenseUseCase } from "./CreateExpenseUseCase.js";
import type { IExpenseRepository } from "@domain/repositories/IExpenseRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { Group, GroupType } from "@domain/entities/Group.js";
import { Expense } from "@domain/entities/Expense.js";

describe("CreateExpenseUseCase", () => {
  let useCase: CreateExpenseUseCase;
  let mockGroupRepo: IGroupRepository;
  let mockExpenseRepo: IExpenseRepository;

  beforeEach(() => {
    // 建立 Mock Repositories
    mockGroupRepo = {
      findById: vi.fn(),
      isUserInGroup: vi.fn(),
    };

    mockExpenseRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByGroupId: vi.fn(),
    };

    useCase = new CreateExpenseUseCase(mockGroupRepo, mockExpenseRepo);
  });

  describe("成功案例", () => {
    it("應該成功建立平分(EQUAL)類型的支出", async () => {
      // Arrange
      const groupId = "group-123";
      const payerId = "user-1";
      const memberIds = ["user-1", "user-2", "user-3"];

      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: payerId,
        memberIds: memberIds,
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);
      vi.mocked(mockExpenseRepo.save).mockResolvedValue();

      const request = {
        description: "午餐",
        totalAmount: 300,
        payerId: payerId,
        groupId: groupId,
        splitType: "EQUAL" as const,
        splitData: memberIds,
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockGroupRepo.findById).toHaveBeenCalledWith(groupId);
      expect(mockGroupRepo.isUserInGroup).toHaveBeenCalledWith(
        payerId,
        groupId,
      );
      expect(mockExpenseRepo.save).toHaveBeenCalledTimes(1);

      // 驗證儲存的 Expense 物件
      const savedExpense = vi.mocked(mockExpenseRepo.save).mock.calls[0]![0];
      expect(savedExpense).toBeInstanceOf(Expense);
      expect(savedExpense.amount).toBe(300);
      expect(savedExpense.splits).toHaveLength(3);
      expect(savedExpense.splits[0]!.amount).toBe(100);
    });

    it("應該成功建立百分比(PERCENTAGE)類型的支出", async () => {
      // Arrange
      const groupId = "group-123";
      const payerId = "user-1";

      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: payerId,
        memberIds: ["user-1", "user-2"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);
      vi.mocked(mockExpenseRepo.save).mockResolvedValue();

      const request = {
        description: "專案獎金",
        totalAmount: 1000,
        payerId: payerId,
        groupId: groupId,
        splitType: "PERCENTAGE" as const,
        splitData: {
          "user-1": 60, // 60%
          "user-2": 40, // 40%
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockExpenseRepo.save).toHaveBeenCalledTimes(1);

      const savedExpense = vi.mocked(mockExpenseRepo.save).mock.calls[0]![0];
      expect(savedExpense.splits).toHaveLength(2);
      expect(savedExpense.splits[0]!.amount).toBe(600); // 1000 * 60%
      expect(savedExpense.splits[1]!.amount).toBe(400); // 1000 * 40%
    });

    it("應該成功建立指定金額(EXACT)類型的支出", async () => {
      // Arrange
      const groupId = "group-123";
      const payerId = "user-1";

      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: payerId,
        memberIds: ["user-1", "user-2", "user-3"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);
      vi.mocked(mockExpenseRepo.save).mockResolvedValue();

      const request = {
        description: "共同採購",
        totalAmount: 500,
        payerId: payerId,
        groupId: groupId,
        splitType: "EXACT" as const,
        splitData: {
          "user-1": 200,
          "user-2": 150,
          "user-3": 150,
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockExpenseRepo.save).toHaveBeenCalledTimes(1);

      const savedExpense = vi.mocked(mockExpenseRepo.save).mock.calls[0]![0];
      expect(savedExpense.splits).toHaveLength(3);
      expect(savedExpense.splits[0]!.amount).toBe(200);
      expect(savedExpense.splits[1]!.amount).toBe(150);
      expect(savedExpense.splits[2]!.amount).toBe(150);
    });
  });

  describe("失敗案例 - 群組驗證", () => {
    it("當群組不存在時應該失敗", async () => {
      // Arrange
      vi.mocked(mockGroupRepo.findById).mockResolvedValue(null);

      const request = {
        description: "午餐",
        totalAmount: 300,
        payerId: "user-1",
        groupId: "non-existent-group",
        splitType: "EQUAL" as const,
        splitData: ["user-1"],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("找不到該群組");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });

    it("當付款人不在群組中時應該失敗", async () => {
      // Arrange
      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: "user-1",
        memberIds: ["user-1", "user-2"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(false); // 付款人不在群組中

      const request = {
        description: "午餐",
        totalAmount: 300,
        payerId: "user-999", // 不在群組中的使用者
        groupId: "group-123",
        splitType: "EQUAL" as const,
        splitData: ["user-1", "user-2"],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("付款人不在該群組中");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("失敗案例 - 分帳邏輯驗證", () => {
    beforeEach(() => {
      // 預設群組和付款人驗證都通過
      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: "user-1",
        memberIds: ["user-1", "user-2"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);
    });

    it("當百分比總和不等於 100% 時應該失敗", async () => {
      // Arrange
      const request = {
        description: "測試",
        totalAmount: 1000,
        payerId: "user-1",
        groupId: "group-123",
        splitType: "PERCENTAGE" as const,
        splitData: {
          "user-1": 60,
          "user-2": 30, // 總和只有 90%
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("百分比總和");
      expect(result.error).toContain("必須等於 100%");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });

    it("當指定金額總和不等於總金額時應該失敗", async () => {
      // Arrange
      const request = {
        description: "測試",
        totalAmount: 500,
        payerId: "user-1",
        groupId: "group-123",
        splitType: "EXACT" as const,
        splitData: {
          "user-1": 200,
          "user-2": 200, // 總和只有 400,不等於 500
        },
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("金額不符");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("失敗案例 - Entity 驗證", () => {
    beforeEach(() => {
      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: "user-1",
        memberIds: ["user-1"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);
    });

    it("當支出描述為空時應該失敗", async () => {
      // Arrange
      const request = {
        description: "", // 空描述
        totalAmount: 100,
        payerId: "user-1",
        groupId: "group-123",
        splitType: "EQUAL" as const,
        splitData: ["user-1"],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("支出描述不能為空");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });

    it("當支出金額小於等於 0 時應該失敗", async () => {
      // Arrange
      const request = {
        description: "測試",
        totalAmount: 0, // 無效金額
        payerId: "user-1",
        groupId: "group-123",
        splitType: "EQUAL" as const,
        splitData: ["user-1"],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("支出金額必須大於 0");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("邊界案例", () => {
    beforeEach(() => {
      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: "user-1",
        memberIds: ["user-1"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);
      vi.mocked(mockExpenseRepo.save).mockResolvedValue();
    });

    it("應該處理單人支出", async () => {
      // Arrange
      const request = {
        description: "個人午餐",
        totalAmount: 100,
        payerId: "user-1",
        groupId: "group-123",
        splitType: "EQUAL" as const,
        splitData: ["user-1"],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      const savedExpense = vi.mocked(mockExpenseRepo.save).mock.calls[0]![0];
      expect(savedExpense.splits).toHaveLength(1);
      expect(savedExpense.splits[0]!.amount).toBe(100);
    });

    it("應該處理有餘數的平分情況", async () => {
      // Arrange
      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: "user-1",
        memberIds: ["user-1", "user-2", "user-3"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);

      const request = {
        description: "測試餘數",
        totalAmount: 100, // 100 / 3 = 33.33...
        payerId: "user-1",
        groupId: "group-123",
        splitType: "EQUAL" as const,
        splitData: ["user-1", "user-2", "user-3"],
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      const savedExpense = vi.mocked(mockExpenseRepo.save).mock.calls[0]![0];

      // 驗證總和仍然等於 100
      const total = savedExpense.splits.reduce(
        (sum, split) => sum + split.amount,
        0,
      );
      expect(total).toBe(100);

      // 第一個人應該多分到餘數
      expect(savedExpense.splits[0]!.amount).toBe(34); // 33 + 1(餘數)
      expect(savedExpense.splits[1]!.amount).toBe(33);
      expect(savedExpense.splits[2]!.amount).toBe(33);
    });
  });

  describe("未知分帳類型", () => {
    it("當傳入未知的分帳類型時應該失敗", async () => {
      // Arrange
      const mockGroup = Group.create({
        name: "測試群組",
        type: GroupType.TEAM,
        ownerId: "user-1",
        memberIds: ["user-1"],
      }).getValue();

      vi.mocked(mockGroupRepo.findById).mockResolvedValue(mockGroup);
      vi.mocked(mockGroupRepo.isUserInGroup).mockResolvedValue(true);

      const request = {
        description: "測試",
        totalAmount: 100,
        payerId: "user-1",
        groupId: "group-123",
        splitType: "UNKNOWN" as any, // 未知類型
        splitData: {},
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("未知的分帳類型");
      expect(mockExpenseRepo.save).not.toHaveBeenCalled();
    });
  });
});
