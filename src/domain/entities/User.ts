import { Entity } from "@shared/core/Entity.js";
import { Result } from "@shared/core/Result.js";

interface UserProps {
  name: string;
  email: string;
  personalGroupId?: string;
}

export class User extends Entity<UserProps> {
  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get personalGroupId(): string | undefined {
    return this.props.personalGroupId;
  }
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }
  public static create(props: UserProps, id?: string): Result<User> {
    // 簡單的商業規則驗證
    if (!props.name || props.name.length < 2) {
      return Result.fail("Name must be at least 2 characters long.");
    }
    if (!props.email || !props.email.includes("@")) {
      return Result.fail("Invalid email address.");
    }

    return Result.ok<User>(new User(props, id));
  }

  public setPersonalGroup(groupId: string): void {
    this.props.personalGroupId = groupId;
  }
}
