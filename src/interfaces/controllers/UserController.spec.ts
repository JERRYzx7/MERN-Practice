import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { UserController } from "./UserController.js";
import { User } from "@domain/entities/User.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import type { IPasswordService } from "@application/services/IPasswordService.js";
import type { IJwtService } from "@application/services/IJwtService.js";

describe("UserController.updateMe", () => {
  let controller: UserController;
  let mockUserRepo: IUserRepository;
  let mockGroupRepo: IGroupRepository;
  let mockPasswordService: IPasswordService;
  let mockJwtService: IJwtService;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      findByIds: vi.fn(),
    };
    mockGroupRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      isUserInGroup: vi.fn(),
      save: vi.fn(),
    };
    mockPasswordService = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;

    controller = new UserController(mockUserRepo, mockGroupRepo, mockPasswordService, mockJwtService);
  });

  it("更新 customCategories 後，response 應包含更新後的 customCategories", async () => {
    const existingUser = User.create(
      { name: "小明", email: "ming@example.com", passwordHash: "hash" },
      "user-1",
    ).getValue();

    vi.mocked(mockUserRepo.findById).mockResolvedValue(existingUser);
    vi.mocked(mockUserRepo.save).mockResolvedValue();

    const req = {
      userId: "user-1",
      body: { customCategories: { expense: ["飲料", "零食"], income: ["獎金"] } },
    } as unknown as Request;

    await controller.updateMe(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          customCategories: { expense: ["飲料", "零食"], income: ["獎金"] },
        }),
      }),
    );
    expect(mockUserRepo.save).toHaveBeenCalled();
  });

  it("login response 應包含 customCategories", async () => {
    const existingUser = User.create(
      { name: "小明", email: "ming@example.com", passwordHash: "hash",
        customCategories: { expense: ["飲料"], income: [] } },
      "user-1",
    ).getValue();

    vi.mocked(mockUserRepo.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(mockPasswordService.compare).mockResolvedValue(true);
    vi.mocked(mockJwtService.sign).mockReturnValue("token-xyz");

    const req = {
      body: { email: "ming@example.com", password: "password123" },
    } as unknown as Request;

    await controller.login(req, res as Response, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          customCategories: { expense: ["飲料"], income: [] },
        }),
      }),
    );
  });
});
