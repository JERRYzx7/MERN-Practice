import jwt from "jsonwebtoken";
import type { IJwtService } from "@application/services/IJwtService.js";

export class JwtService implements IJwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(secret: string, expiresIn = "7d") {
    if (!secret) throw new Error("JWT_SECRET is required");
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  sign(payload: Record<string, unknown>): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): Record<string, unknown> | null {
    try {
      return jwt.verify(token, this.secret) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
