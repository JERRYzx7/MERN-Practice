import { v4 as uuidv4 } from "uuid"; // 需安裝 npm install uuid

export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id ? id : uuidv4();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }
}
