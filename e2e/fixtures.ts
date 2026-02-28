import { test as base, expect, type APIRequestContext } from "@playwright/test";

// ─── Fixtures ──────────────────────────────────────────────────────────────

type ApiFixtures = {
  /** 建立並自動清理的 test user */
  testUser: { id: string; email: string; name: string };
  /** 建立並自動清理的 test group（需要 testUser）*/
  testGroup: { id: string; ownerId: string; memberId: string };
};

export const test = base.extend<ApiFixtures>({
  testUser: async ({ request }, use) => {
    const email = `user-${Date.now()}@test.com`;
    const res = await request.post("/api/users/register", {
      data: { name: "Test User", email },
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    await use({ id: data.id as string, email, name: "Test User" });
    // Teardown: 目前無 DELETE endpoint，未來補上時取消註解
    // await request.delete(`/api/users/${data.id}`);
  },

  testGroup: async ({ request, testUser }, use) => {
    const memberId = `member-${Date.now()}`;
    const res = await request.post("/api/groups", {
      data: {
        name: "Test Group",
        ownerId: testUser.id,
        memberIds: [testUser.id, memberId],
      },
    });
    expect(res.status()).toBe(201);
    const { data } = await res.json();
    await use({ id: data.id as string, ownerId: testUser.id, memberId });
  },
});

export { expect };
