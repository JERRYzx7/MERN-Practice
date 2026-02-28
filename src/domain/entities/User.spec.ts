import { User } from "./User.js";

describe("User Entity (領域實體測試)", () => {
  it("應該能夠成功建立一個有效的 User", () => {
    const userProps = {
      name: "小明",
      email: "ming@example.com",
    };

    const result = User.create(userProps);

    // 測試 Result 模式的優點
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().name).toBe("小明");
    expect(result.getValue().email).toBe("ming@example.com");
    expect(result.getValue().id).toBeDefined(); // 檢查 UUID 是否自動生成
  });

  it("如果 Email 格式錯誤，應該回傳失敗的 Result", () => {
    const invalidProps = {
      name: "小明",
      email: "invalid-email", // 沒有 @ 符號
    };

    const result = User.create(invalidProps);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Invalid email address.");
  });

  it("新建立的 User，customCategories 預設為 { expense: [], income: [] }", () => {
    const result = User.create({ name: "小明", email: "ming@example.com" });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().customCategories).toEqual({ expense: [], income: [] });
  });

  it("updateCustomCategories 後 getter 回傳更新後的值", () => {
    const user = User.create({ name: "小明", email: "ming@example.com" }).getValue();

    user.updateCustomCategories({ expense: ["飲料", "零食"], income: ["獎金"] });

    expect(user.customCategories).toEqual({ expense: ["飲料", "零食"], income: ["獎金"] });
  });

  it("如果名稱太短，應該回傳失敗的 Result", () => {
    const shortNameProps = {
      name: "a", // 只有 1 個字
      email: "test@test.com",
    };

    const result = User.create(shortNameProps);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Name must be at least 2 characters long.");
  });
});
