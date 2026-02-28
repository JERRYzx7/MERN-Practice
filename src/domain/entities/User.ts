import { Entity } from "@shared/core/Entity.js";
import { Result } from "@shared/core/Result.js";

interface UserProps {
  name: string;
  email: string;
  personalGroupId?: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  oauthProvider?: string | null;
  oauthId?: string | null;
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
  get passwordHash(): string | null | undefined {
    return this.props.passwordHash;
  }
  get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
  }
  get oauthProvider(): string | null | undefined {
    return this.props.oauthProvider;
  }
  get oauthId(): string | null | undefined {
    return this.props.oauthId;
  }
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }
  public static create(props: UserProps, id?: string): Result<User> {
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
