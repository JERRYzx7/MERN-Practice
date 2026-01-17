import { Expense } from "./Expense.js";
import { Split } from "./Split.js";

describe("Expense Entity 核心邏輯測試", () => {
  const validUser1 = "user-1";
  const validUser2 = "user-2";
  const validGroup = "group-999";

  describe("成功案例", () => {
    it("應該建立成功的支出 (整數)", () => {
      const result = Expense.create({
        description: "買午餐",
        amount: 300,
        payerId: validUser1,
        groupId: validGroup,
        splits: [
          new Split({ userId: validUser1, amount: 150 }),
          new Split({ userId: validUser2, amount: 150 }),
        ],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().amount).toBe(300);
    });

    it("應該能夠處理浮點數微小誤差 (0.01 門檻)", () => {
      // 模擬 100 除以 3 產生的誤差：33.33 + 33.33 + 33.33 = 99.99
      const result = Expense.create({
        description: "除不盡的測試",
        amount: 100,
        payerId: validUser1,
        groupId: validGroup,
        splits: [
          new Split({ userId: "u1", amount: 33.33 }),
          new Split({ userId: "u2", amount: 33.33 }),
          new Split({ userId: "u3", amount: 33.33 }),
        ],
      });

      // 因為 Math.abs(99.99 - 100) = 0.01，沒超過 0.01，所以應該要過
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("失敗案例 (Negative Testing)", () => {
    it("描述為空時應該失敗", () => {
      const result = Expense.create({
        description: "   ", // 全空白
        amount: 100,
        payerId: validUser1,
        groupId: validGroup,
        splits: [new Split({ userId: validUser1, amount: 100 })],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("支出描述不能為空");
    });

    it("金額為 0 或負數時應該失敗", () => {
      const result = Expense.create({
        description: "免費的東西",
        amount: 0,
        payerId: validUser1,
        groupId: validGroup,
        splits: [],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("支出金額必須大於 0");
    });

    it("當分攤總額與支出總額差距過大時應該失敗", () => {
      const result = Expense.create({
        description: "算錯錢的帳單",
        amount: 100,
        payerId: validUser1,
        groupId: validGroup,
        splits: [
          new Split({ userId: validUser1, amount: 50 }),
          new Split({ userId: validUser2, amount: 40 }), // 總共 90，差 10 元
        ],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("金額不符");
    });
  });
});
