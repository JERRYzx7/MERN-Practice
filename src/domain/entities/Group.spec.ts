import { Group, GroupType } from "./Group.js";

describe("Group Entity (群組實體測試)", () => {
  const mockOwnerId = "user-123";
  const mockFriendId = "user-456";

  describe("個人群組 (PERSONAL)", () => {
    it("應該成功建立個人群組，且成員只有自己", () => {
      const result = Group.create({
        name: "我的私有空間",
        type: GroupType.PERSONAL,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().memberIds).toHaveLength(1);
    });

    it("如果個人群組試圖加入別人，建立時應該失敗", () => {
      const result = Group.create({
        name: "非法個人群組",
        type: GroupType.PERSONAL,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId, mockFriendId], // 兩個人，違反規則
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("個人群組只能包含擁有者本人");
    });

    it("建立後，不應該能透過 addMember 增加成員", () => {
      const group = Group.create({
        name: "個人空間",
        type: GroupType.PERSONAL,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const result = group.addMember(mockFriendId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("個人群組不能添加成員");
    });
  });

  describe("多人群組 (TEAM)", () => {
    it("應該成功建立多人群組並允許加入成員", () => {
      const groupResult = Group.create({
        name: "室友分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      });

      expect(groupResult.isSuccess).toBe(true);

      const group = groupResult.getValue();
      const addResult = group.addMember(mockFriendId);

      expect(addResult.isSuccess).toBe(true);
      expect(group.memberIds).toContain(mockFriendId);
    });
  });

  describe("邀請 Token 功能", () => {
    it("TEAM 群組應該能成功加入邀請 token", () => {
      const group = Group.create({
        name: "室友分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const inviteCode = "abc-123-xyz";
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天後

      const result = group.addInviteToken(inviteCode, expiresAt, mockOwnerId);

      expect(result.isSuccess).toBe(true);
      expect(group.inviteTokens).toHaveLength(1);
      expect(group.inviteTokens![0]).toEqual({
        code: inviteCode,
        expiresAt,
        createdBy: mockOwnerId,
      });
    });

    it("PERSONAL 群組應該拒絕加入邀請 token", () => {
      const group = Group.create({
        name: "個人空間",
        type: GroupType.PERSONAL,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const inviteCode = "abc-123-xyz";
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = group.addInviteToken(inviteCode, expiresAt, mockOwnerId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("個人群組不能產生邀請連結");
    });

    it("應該能透過有效的邀請 token 加入成員", () => {
      const group = Group.create({
        name: "室友分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const inviteCode = "valid-code-123";
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      group.addInviteToken(inviteCode, expiresAt, mockOwnerId);

      const result = group.acceptInvite(inviteCode, mockFriendId);

      expect(result.isSuccess).toBe(true);
      expect(group.memberIds).toContain(mockFriendId);
    });

    it("過期的邀請 token 應該被拒絕", () => {
      const group = Group.create({
        name: "室友分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const inviteCode = "expired-code";
      const expiresAt = new Date(Date.now() - 1000); // 已過期
      group.addInviteToken(inviteCode, expiresAt, mockOwnerId);

      const result = group.acceptInvite(inviteCode, mockFriendId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("邀請連結已過期");
    });

    it("已經是成員的使用者不應該能重複加入", () => {
      const group = Group.create({
        name: "室友分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const inviteCode = "code-123";
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      group.addInviteToken(inviteCode, expiresAt, mockOwnerId);

      const result = group.acceptInvite(inviteCode, mockOwnerId); // 擁有者自己嘗試加入

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("您已經是群組成員");
    });
  });

  describe("移除成員與離開群組", () => {
    it("擁有者可以移除其他成員", () => {
      const group = Group.create({
        name: "旅遊分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId, mockFriendId],
      }).getValue();

      const result = group.removeMember(mockOwnerId, mockFriendId);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().groupDeleted).toBe(false);
      expect(group.memberIds).toEqual([mockOwnerId]);
      expect(group.ownerId).toBe(mockOwnerId);
    });

    it("非擁有者不可移除其他成員", () => {
      const group = Group.create({
        name: "旅遊分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId, mockFriendId, "user-789"],
      }).getValue();

      const result = group.removeMember(mockFriendId, "user-789");

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("只有擁有者可以移除其他成員");
    });

    it("成員可自行離開群組", () => {
      const group = Group.create({
        name: "旅遊分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId, mockFriendId],
      }).getValue();

      const result = group.removeMember(mockFriendId, mockFriendId);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().groupDeleted).toBe(false);
      expect(group.memberIds).toEqual([mockOwnerId]);
      expect(group.ownerId).toBe(mockOwnerId);
    });

    it("擁有者自行離開時會轉移 owner 給下一位成員", () => {
      const nextOwnerId = "user-999";
      const group = Group.create({
        name: "旅遊分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId, nextOwnerId, mockFriendId],
      }).getValue();

      const result = group.removeMember(mockOwnerId, mockOwnerId);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().groupDeleted).toBe(false);
      expect(group.ownerId).toBe(nextOwnerId);
      expect(group.memberIds).toEqual([nextOwnerId, mockFriendId]);
    });

    it("最後一位擁有者離開時標記為刪除群組", () => {
      const group = Group.create({
        name: "旅遊分帳",
        type: GroupType.TEAM,
        ownerId: mockOwnerId,
        memberIds: [mockOwnerId],
      }).getValue();

      const result = group.removeMember(mockOwnerId, mockOwnerId);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().groupDeleted).toBe(true);
      expect(group.memberIds).toEqual([]);
    });
  });
});
