import { test, expect } from "./fixtures.js";
import { test as base } from "@playwright/test";

// ─── User Registration ──────────────────────────────────────────────────────

base.describe("POST /api/users/register", () => {
  base.test("成功註冊新用戶並自動建立 Personal Group", async ({ request }) => {
    const email = `alice-${Date.now()}@example.com`;
    const res = await request.post("/api/users/register", {
      data: { name: "Alice Chen", email },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.email).toBe(email);
    expect(body.data.name).toBe("Alice Chen");
  });

  base.test("重複 email 回傳 409", async ({ request }) => {
    const email = `dup-${Date.now()}@example.com`;
    await request.post("/api/users/register", {
      data: { name: "Bob", email },
    });

    const res = await request.post("/api/users/register", {
      data: { name: "Bob2", email },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  base.test("姓名過短回傳 400", async ({ request }) => {
    const res = await request.post("/api/users/register", {
      data: { name: "X", email: `short-${Date.now()}@example.com` },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.details).toBeDefined();
  });

  base.test("無效 email 格式回傳 400", async ({ request }) => {
    const res = await request.post("/api/users/register", {
      data: { name: "Charlie", email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Group Management ───────────────────────────────────────────────────────

test.describe("POST /api/groups", () => {
  test("成功建立 Team Group", async ({ request, testUser }) => {
    const res = await request.post("/api/groups", {
      data: {
        name: "Travel 2025",
        ownerId: testUser.id,
        memberIds: [testUser.id, `member-${Date.now()}`],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeTruthy();
  });

  test("名稱為空回傳 400", async ({ request, testUser }) => {
    const res = await request.post("/api/groups", {
      data: {
        name: "",
        ownerId: testUser.id,
        memberIds: [testUser.id],
      },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("POST /api/groups/:groupId/members", () => {
  test("成功加入新成員", async ({ request, testGroup }) => {
    const newMemberId = `new-member-${Date.now()}`;
    const res = await request.post(
      `/api/groups/${testGroup.id}/members`,
      { data: { userId: newMemberId } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("加入不存在的群組回傳 404", async ({ request }) => {
    const res = await request.post("/api/groups/non-existent-id/members", {
      data: { userId: "some-user" },
    });
    expect(res.status()).toBe(404);
  });
});

// ─── Expense Creation ───────────────────────────────────────────────────────

test.describe("POST /api/expenses", () => {
  test("EQUAL split — 成功建立支出", async ({ request, testGroup }) => {
    const res = await request.post("/api/expenses", {
      data: {
        description: "Dinner",
        totalAmount: 100,
        payerId: testGroup.ownerId,
        groupId: testGroup.id,
        splitType: "EQUAL",
        memberIds: [testGroup.ownerId, testGroup.memberId],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("PERCENTAGE split — 正確分帳", async ({ request, testGroup }) => {
    const res = await request.post("/api/expenses", {
      data: {
        description: "Hotel",
        totalAmount: 200,
        payerId: testGroup.ownerId,
        groupId: testGroup.id,
        splitType: "PERCENTAGE",
        percentageMap: {
          [testGroup.ownerId]: 60,
          [testGroup.memberId]: 40,
        },
      },
    });
    expect(res.status()).toBe(201);
  });

  test("EXACT split — 指定金額分帳", async ({ request, testGroup }) => {
    const res = await request.post("/api/expenses", {
      data: {
        description: "Groceries",
        totalAmount: 75,
        payerId: testGroup.ownerId,
        groupId: testGroup.id,
        splitType: "EXACT",
        exactMap: {
          [testGroup.ownerId]: 50,
          [testGroup.memberId]: 25,
        },
      },
    });
    expect(res.status()).toBe(201);
  });

  test("EXACT split 金額不符回傳 422", async ({ request, testGroup }) => {
    const res = await request.post("/api/expenses", {
      data: {
        description: "Wrong split",
        totalAmount: 100,
        payerId: testGroup.ownerId,
        groupId: testGroup.id,
        splitType: "EXACT",
        exactMap: {
          [testGroup.ownerId]: 40,
          [testGroup.memberId]: 40,
        },
      },
    });
    expect(res.status()).toBe(422);
  });

  test("缺少必填欄位回傳 400", async ({ request, testGroup }) => {
    const res = await request.post("/api/expenses", {
      data: {
        totalAmount: 100,
        // description 缺失
        payerId: testGroup.ownerId,
        groupId: testGroup.id,
        splitType: "EQUAL",
        memberIds: [testGroup.ownerId],
      },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Balance Calculation ────────────────────────────────────────────────────

test.describe("GET /api/groups/:groupId/balance", () => {
  test("空群組餘額為 0 筆結算", async ({ request, testGroup }) => {
    const res = await request.get(
      `/api/groups/${testGroup.id}/balance`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.settlements).toHaveLength(0);
  });

  test("建立支出後餘額正確計算", async ({ request, testGroup }) => {
    // 建立 $90 支出，owner 付款、平均分攤
    await request.post("/api/expenses", {
      data: {
        description: "Lunch",
        totalAmount: 90,
        payerId: testGroup.ownerId,
        groupId: testGroup.id,
        splitType: "EQUAL",
        memberIds: [testGroup.ownerId, testGroup.memberId],
      },
    });

    const res = await request.get(
      `/api/groups/${testGroup.id}/balance`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // member 應該欠 owner $45
    const settlements: Array<{ from: string; to: string; amount: number }> =
      body.data.settlements;
    expect(settlements).toHaveLength(1);
    expect(settlements[0]!.from).toBe(testGroup.memberId);
    expect(settlements[0]!.to).toBe(testGroup.ownerId);
    expect(settlements[0]!.amount).toBeCloseTo(45, 1);
  });

  test("不存在的群組回傳 404", async ({ request }) => {
    const res = await request.get("/api/groups/ghost-id/balance");
    expect(res.status()).toBe(404);
  });
});
