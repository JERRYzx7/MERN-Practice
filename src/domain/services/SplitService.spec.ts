import { SplitService } from "./SplitService.js";
import { Split } from "@domain/entities/Split.js";

describe("SplitService 分帳邏輯鮮血測試", () => {
  it("當付款總額不等於總支出時，應該驗證失敗 (B != A)", () => {
    const totalAmount = 1000;
    const payers = [{ userId: "user-A", amount: 800 }]; // 少了 200
    const owerSplits = [new Split({ userId: "user-A", amount: 1000 })];

    const result = SplitService.validateBalance(
      totalAmount,
      payers,
      owerSplits,
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain("付款總額");
  });

  it("應該成功執行預設平分並通過驗證", () => {
    const totalAmount = 100;
    const userIds = ["user-A", "user-B", "user-C"];

    // 1. 自動計算平分 (C)
    const splits = SplitService.calculateEqualSplits(totalAmount, userIds);

    // 2. 假設預設付款人 (B)
    const payers = [{ userId: "user-A", amount: 100 }];

    // 3. 驗證 A=B=C
    const result = SplitService.validateBalance(totalAmount, payers, splits);

    expect(result.isSuccess).toBe(true);
    expect(splits[0]!.amount).toBe(33.34); // 餘數處理驗證
  });

  describe("百分比分帳邏輯", () => {
    it("當百分比總和不等於 100 時，應該驗證失敗", () => {
      const totalAmount = 1000;
      const percentageMap = {
        "user-A": 50,
        "user-B": 30,
        // 總和只有 80%，缺少 20%
      };

      const result = SplitService.calculatePercentageSplits(
        totalAmount,
        percentageMap,
      );

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain("100");
    });

    it("應該正確計算百分比分帳", () => {
      const totalAmount = 1000;
      const percentageMap = {
        "user-A": 50, // 500
        "user-B": 30, // 300
        "user-C": 20, // 200
      };

      const result = SplitService.calculatePercentageSplits(
        totalAmount,
        percentageMap,
      );

      expect(result.isSuccess).toBe(true);
      const splits = result.getValue()!;
      expect(splits.length).toBe(3);
      expect(splits.find((s: Split) => s.userId === "user-A")!.amount).toBe(
        500,
      );
      expect(splits.find((s: Split) => s.userId === "user-B")!.amount).toBe(
        300,
      );
      expect(splits.find((s: Split) => s.userId === "user-C")!.amount).toBe(
        200,
      );
    });

    it("應該正確處理浮點數精度和餘數", () => {
      const totalAmount = 100;
      const percentageMap = {
        "user-A": 33.33,
        "user-B": 33.33,
        "user-C": 33.34,
      };

      const result = SplitService.calculatePercentageSplits(
        totalAmount,
        percentageMap,
      );

      expect(result.isSuccess).toBe(true);
      const splits = result.getValue()!;

      // 驗證總額正確
      const total = splits.reduce((sum: number, s: Split) => sum + s.amount, 0);
      expect(total).toBe(100);
    });

    it("百分比分帳結果應該通過 validateBalance 驗證", () => {
      const totalAmount = 1000;
      const percentageMap = {
        "user-A": 60,
        "user-B": 40,
      };

      const splitsResult = SplitService.calculatePercentageSplits(
        totalAmount,
        percentageMap,
      );
      const splits = splitsResult.getValue()!;

      // 假設 user-A 全額付款
      const payers = [{ userId: "user-A", amount: 1000 }];

      const validationResult = SplitService.validateBalance(
        totalAmount,
        payers,
        splits,
      );

      expect(validationResult.isSuccess).toBe(true);
    });
  });
});
