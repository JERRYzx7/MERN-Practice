import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Group, GroupType } from "@domain/entities/Group.js";
import type { IGroupRepository } from "@domain/repositories/IGroupRepository.js";
import { v4 as uuidv4 } from "uuid";

const CreateGroupSchema = z.object({
  name: z.string().min(1),
  ownerId: z.string().min(1),
  memberIds: z.array(z.string()).min(1),
});

const AddMemberSchema = z.object({
  userId: z.string().min(1),
});

export class GroupController {
  constructor(private groupRepo: IGroupRepository) {}

  createGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const parsed = CreateGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, ownerId, memberIds } = parsed.data;
    const groupResult = Group.create(
      { name, type: GroupType.TEAM, ownerId, memberIds },
      uuidv4(),
    );

    if (groupResult.isFailure) {
      res.status(422).json({ success: false, error: groupResult.error });
      return;
    }

    const group = groupResult.getValue();
    await this.groupRepo.save(group);

    res.status(201).json({ success: true, data: { id: group.id } });
  };

  addMember = async (
    req: Request<{ groupId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { groupId } = req.params;
    const parsed = AddMemberSchema.safeParse(req.body);

    if (!groupId) {
      res.status(400).json({ success: false, error: "groupId is required" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, error: "Group not found" });
      return;
    }

    const addResult = group.addMember(parsed.data.userId);
    if (addResult.isFailure) {
      res.status(422).json({ success: false, error: addResult.error });
      return;
    }

    await this.groupRepo.save(group);
    res.status(200).json({ success: true });
  };
}
