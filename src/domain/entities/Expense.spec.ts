import { describe, it, expect } from "vitest";
import { Expense } from "./Expense.js";
import { Split } from "./Split.js";
import { Payment } from "./Payment.js";

describe("Expense Entity 核心邏輯測試", () => {
  const validUser1 = "user-1";
  const validUser2 = "user-2";
  const validGroup = "group-999";

  describe("成功案例", () => {
    it("應該建立成功的支出 (整數)", () => {
      const result = Expense.create({
        description: "買午餐",
        currency: "TWD",
        groupId: validGroup,
        payments: [new Payment({ userId: validUser1, amount: 300 })],
        splits: [
          new Split({ userId: validUser1, amount: 150 }),
          new Split({ userId: validUser2, amount: 150 }),
        ],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().amount).toBe(300);
    });

    it("應該能夠處理浮點數微小誤差 (0.01 門檻)", () => {
      const result = Expense.create({
        description: "除不盡的測試",
        currency: "TWD",
        groupId: validGroup,
        payments: [new Payment({ userId: validUser1, amount: 100 })],
        splits: [
          new Split({ userId: "u1", amount: 33.33 }),
          new Split({ userId: "u2", amount: 33.33 }),
          new Split({ userId: "u3", amount: 33.33 }),
        ],
      });

      expect(result.isSuccess).toBe(true);
    });

    it("應該支援多付款人", () => {
      const result = Expense.create({
        description: "晚餐",
        currency: "TWD",
        groupId: validGroup,
        payments: [
          new Payment({ userId: validUser1, amount: 280 }),
          new Payment({ userId: validUser2, amount: 30 }),
        ],
        splits: [
          new Split({ userId: validUser1, amount: 155 }),
          new Split({ userId: validUser2, amount: 155 }),
        ],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().amount).toBe(310);
    });
  });

  describe("失敗案例 (Negative Testing)", () => {
    it("描述為空時應該失敗", () => {
      const result = Expense.create({
        description: "   ",
        currency: "TWD",
        groupId: validGroup,
        payments: [new Payment({ userId: validUser1, amount: 100 })],
        splits: [new Split({ userId: validUser1, amount: 100 })],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("支出描述不能為空");
    });

    it("payments 為空時應該失敗", () => {
      const result = Expense.create({
        description: "免費的東西",
        currency: "TWD",
        groupId: validGroup,
        payments: [],
        splits: [],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("至少需要有一個付款項目");
    });

    it("payments 總額為 0 時應該失敗", () => {
      const result = Expense.create({
        description: "金額為零",
        currency: "TWD",
        groupId: validGroup,
        payments: [new Payment({ userId: validUser1, amount: 0 })],
        splits: [],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("支出金額必須大於 0");
    });

    it("當分攤總額與支出總額差距過大時應該失敗", () => {
      const result = Expense.create({
        description: "算錯錢的帳單",
        currency: "TWD",
        groupId: validGroup,
        payments: [new Payment({ userId: validUser1, amount: 100 })],
        splits: [
          new Split({ userId: validUser1, amount: 50 }),
          new Split({ userId: validUser2, amount: 40 }),
        ],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("金額不符");
    });
  });
});

