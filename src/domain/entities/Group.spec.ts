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
});
