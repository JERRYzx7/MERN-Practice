import { Entity } from "@shared/core/Entity.js";
import { Result } from "@shared/core/Result.js";

export enum GroupType {
  PERSONAL = "Personal",
  TEAM = "Team",
}

interface GroupProps {
  name: string;
  type: GroupType;
  ownerId: string;
  memberIds: string[];
}

export class Group extends Entity<GroupProps> {
  get name(): string {
    return this.props.name;
  }
  get type(): GroupType {
    return this.props.type;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get memberIds(): string[] {
    return this.props.memberIds;
  }
  private constructor(props: GroupProps, id?: string) {
    super(props, id);
  }
  public static create(props: GroupProps, id?: string): Result<Group> {
    // 簡單的商業規則驗證
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Group>("群組名稱不能為空");
    }

    // 業務規則 2：如果是個人群組，成員必須且只能有 owner 一個人
    if (props.type === GroupType.PERSONAL) {
      if (
        props.memberIds.length !== 1 ||
        props.memberIds[0] !== props.ownerId
      ) {
        return Result.fail<Group>("個人群組只能包含擁有者本人");
      }
    }

    // 業務規則 3：多人群組至少要有一名成員 (owner)
    if (props.type === GroupType.TEAM && props.memberIds.length === 0) {
      return Result.fail<Group>("多人群組必須至少有一名成員");
    }

    return Result.ok<Group>(new Group(props, id));
  }

  public addMember(userId: string): Result<void> {
    if (this.props.type === GroupType.PERSONAL) {
      return Result.fail<void>("個人群組不能添加成員");
    }
    if (this.props.memberIds.includes(userId)) {
      return Result.fail<void>("成員已經存在");
    }
    this.props.memberIds.push(userId);
    return Result.ok<void>();
  }
}
