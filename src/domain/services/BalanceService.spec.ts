import { describe, it, expect } from "vitest";
import { BalanceService } from "./BalanceService.js";
import { Expense } from "@domain/entities/Expense.js";
import { Split } from "@domain/entities/Split.js";
import { Payment } from "@domain/entities/Payment.js";

// Helper: 建立 Expense（單付款人，向後相容）
function makeExpense(
  amount: number,
  payerId: string,
  splits: { userId: string; amount: number }[],
): Expense {
  const result = Expense.create({
    description: "test",
    currency: "TWD",
    groupId: "group-1",
    payments: [new Payment({ userId: payerId, amount })],
    splits: splits.map((s) => new Split(s)),
  });
  if (result.isFailure) throw new Error(result.error ?? "建立失敗");
  return result.getValue();
}

describe("BalanceService", () => {
  // ─────────────────────────────────────────────
  // calculateNetBalances
  // ─────────────────────────────────────────────
  describe("calculateNetBalances", () => {
    it("2 人 1 筆帳：付款者被欠，分攤者欠錢", () => {
      const expense = makeExpense(100, "alice", [
        { userId: "alice", amount: 50 },
        { userId: "bob", amount: 50 },
      ]);

      const balances = BalanceService.calculateNetBalances([expense]);

      // alice 付 100，分攤 50 → 淨 +50
      // bob 分攤 50 → 淨 -50
      expect(balances["alice"]).toBe(50);
      expect(balances["bob"]).toBe(-50);
    });

    it("3 人多筆帳：合併計算", () => {
      // Expense 1: alice 付 90，三人平分
      const e1 = makeExpense(90, "alice", [
        { userId: "alice", amount: 30 },
        { userId: "bob", amount: 30 },
        { userId: "charlie", amount: 30 },
      ]);
      // Expense 2: bob 付 60，bob 和 charlie 平分
      const e2 = makeExpense(60, "bob", [
        { userId: "bob", amount: 30 },
        { userId: "charlie", amount: 30 },
      ]);

      const balances = BalanceService.calculateNetBalances([e1, e2]);

      // alice: +90 - 30 = +60
      // bob: -30 + 60 - 30 = 0
      // charlie: -30 - 30 = -60
      expect(balances["alice"]).toBe(60);
      expect(balances["bob"]).toBe(0);
      expect(balances["charlie"]).toBe(-60);
    });

    it("所有人各付各的：淨餘額均為 0", () => {
      // alice 付 50，只有 alice 分攤
      const e1 = makeExpense(50, "alice", [{ userId: "alice", amount: 50 }]);
      // bob 付 30，只有 bob 分攤
      const e2 = makeExpense(30, "bob", [{ userId: "bob", amount: 30 }]);

      const balances = BalanceService.calculateNetBalances([e1, e2]);

      expect(balances["alice"]).toBe(0);
      expect(balances["bob"]).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // simplifyDebts
  // ─────────────────────────────────────────────
  describe("simplifyDebts", () => {
    it("2 人：bob 欠 alice $50 → 1 筆 settlement", () => {
      const settlements = BalanceService.simplifyDebts({
        alice: 50,
        bob: -50,
      });

      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toEqual({ from: "bob", to: "alice", amount: 50 });
    });

    it("3 人鍊狀債務：最小化轉帳次數", () => {
      // alice +60, charlie -60, bob 0
      const settlements = BalanceService.simplifyDebts({
        alice: 60,
        bob: 0,
        charlie: -60,
      });

      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toEqual({
        from: "charlie",
        to: "alice",
        amount: 60,
      });
    });

    it("複雜 3 人：A +100, B -30, C -70 → 2 筆", () => {
      const settlements = BalanceService.simplifyDebts({
        A: 100,
        B: -30,
        C: -70,
      });

      expect(settlements).toHaveLength(2);
      const total = settlements.reduce((s, t) => s + t.amount, 0);
      expect(total).toBe(100);
      expect(settlements.every((s) => s.to === "A")).toBe(true);
    });

    it("淨餘額均為 0：回傳空 settlements", () => {
      const settlements = BalanceService.simplifyDebts({
        alice: 0,
        bob: 0,
      });

      expect(settlements).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────
  // generateDescriptions
  // ─────────────────────────────────────────────
  describe("generateDescriptions", () => {
    it("轉換為可讀字串", () => {
      const descriptions = BalanceService.generateDescriptions([
        { from: "bob", to: "alice", amount: 50 },
      ]);

      expect(descriptions[0]).toBe("bob 應付給 alice $50.00");
    });

    it("空 settlements → 空陣列", () => {
      expect(BalanceService.generateDescriptions([])).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // calculate (整合)
  // ─────────────────────────────────────────────
  describe("calculate (整合測試)", () => {
    it("2 人 1 帳：完整 BalanceResult", () => {
      const expense = makeExpense(100, "alice", [
        { userId: "alice", amount: 50 },
        { userId: "bob", amount: 50 },
      ]);

      const result = BalanceService.calculate([expense]);

      expect(result.netBalances["alice"]).toBe(50);
      expect(result.netBalances["bob"]).toBe(-50);
      expect(result.settlements).toHaveLength(1);
      expect(result.descriptions[0]).toBe("bob 應付給 alice $50.00");
    });

    it("浮點數邊界：$100 / 3 不產生無效 settlement", () => {
      // 33.34 + 33.33 + 33.33 = 100
      const expense = makeExpense(100, "alice", [
        { userId: "alice", amount: 33.34 },
        { userId: "bob", amount: 33.33 },
        { userId: "charlie", amount: 33.33 },
      ]);

      const result = BalanceService.calculate([expense]);

      // alice 淨: +100 - 33.34 = +66.66
      // bob 淨: -33.33, charlie 淨: -33.33
      expect(result.settlements.length).toBeGreaterThan(0);
      const totalSettled = result.settlements.reduce(
        (s, t) => s + t.amount,
        0,
      );
      // 總轉帳金額應接近 alice 被欠的 66.66
      expect(Math.abs(totalSettled - 66.66)).toBeLessThan(0.02);
    });
  });
});
