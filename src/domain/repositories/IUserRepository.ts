import { User } from "@domain/entities/User.js";

export interface IUserRepository {
  /**
   * 根據 ID 尋找使用者
   */
  findById(id: string): Promise<User | null>;

  /**
   * 根據 Email 尋找使用者（註冊時檢查重複用）
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 儲存或更新使用者
   */
  save(user: User): Promise<void>;

  /**
   * 批次取得使用者（當你要顯示群組成員清單時很有用）
   */
  findByIds(ids: string[]): Promise<User[]>;
}
