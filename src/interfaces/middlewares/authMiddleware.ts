import type { Request, Response, NextFunction } from "express";
import type { IJwtService } from "@application/services/IJwtService.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function createAuthMiddleware(jwtService: IJwtService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const token = authHeader.slice(7);
    const payload = jwtService.verify(token);
    if (!payload || typeof payload["sub"] !== "string") {
      res.status(401).json({ success: false, error: "Invalid token" });
      return;
    }

    req.userId = payload["sub"];
    next();
  };
}
