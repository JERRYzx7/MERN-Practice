import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "@domain/entities/User.js";
import { Group, GroupType } from "@domain/entities/Group.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { v4 as uuidv4 } from "uuid";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export class UserController {
  constructor(
    private userRepo: IUserRepository,
    private groupRepo: IGroupRepository,
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

    const { name, email } = parsed.data;

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: "Email already in use" });
      return;
    }

    const userId = uuidv4();
    const personalGroupId = uuidv4();

    const userResult = User.create({ name, email, personalGroupId }, userId);
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

    res.status(201).json({ success: true, data: { id: userId, email, name, personalGroupId } });
  };
}
