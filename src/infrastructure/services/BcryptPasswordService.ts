import bcrypt from "bcrypt";
import type { IPasswordService } from "@application/services/IPasswordService.js";

const SALT_ROUNDS = 12;

export class BcryptPasswordService implements IPasswordService {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
