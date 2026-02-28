import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "@domain/entities/User.js";
import { Group, GroupType } from "@domain/entities/Group.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import type { IPasswordService } from "@application/services/IPasswordService.js";
import type { IJwtService } from "@application/services/IJwtService.js";
import { v4 as uuidv4 } from "uuid";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const UpdateMeSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export class UserController {
  constructor(
    private userRepo: IUserRepository,
    private groupRepo: IGroupRepository,
    private passwordService: IPasswordService,
    private jwtService: IJwtService,
  ) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: "Email already in use" });
      return;
    }

    const userId = uuidv4();
    const personalGroupId = uuidv4();
    const passwordHash = await this.passwordService.hash(password);

    const userResult = User.create({ name, email, personalGroupId, passwordHash }, userId);
    if (userResult.isFailure) {
      res.status(422).json({ success: false, error: userResult.error });
      return;
    }

    const groupResult = Group.create(
      {
        name: `${name}'s Personal`,
        type: GroupType.PERSONAL,
        ownerId: userId,
        memberIds: [userId],
      },
      personalGroupId,
    );
    if (groupResult.isFailure) {
      res.status(422).json({ success: false, error: groupResult.error });
      return;
    }

    await this.groupRepo.save(groupResult.getValue());
    await this.userRepo.save(userResult.getValue());

    const token = this.jwtService.sign({ sub: userId, email });
    res.status(201).json({ success: true, data: { id: userId, email, name, personalGroupId, token } });
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;

    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const valid = await this.passwordService.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        personalGroupId: user.personalGroupId,
        token,
      },
    });
  };

  updateMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const userId = req.userId!;
    const parsed = UpdateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, avatarUrl, currentPassword, newPassword } = parsed.data;

    const user = await this.userRepo.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    // Password change: verify current password first
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: "請輸入目前密碼" });
        return;
      }
      if (!user.passwordHash) {
        res.status(400).json({ success: false, error: "此帳號不支援密碼修改" });
        return;
      }
      const valid = await this.passwordService.compare(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ success: false, error: "目前密碼不正確" });
        return;
      }
      const newHash = await this.passwordService.hash(newPassword);
      user.updateProfile({ passwordHash: newHash });
    }

    user.updateProfile({
      ...(name !== undefined ? { name } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    });

    await this.userRepo.save(user);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        personalGroupId: user.personalGroupId,
      },
    });
  };
}