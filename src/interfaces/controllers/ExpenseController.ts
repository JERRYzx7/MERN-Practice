import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { CreateExpenseUseCase } from "@application/use-cases/CreateExpenseUseCase.js";
import type { GetBalanceUseCase } from "@application/use-cases/GetBalanceUseCase.js";

const CreateExpenseSchema = z.discriminatedUnion("splitType", [
  z.object({
    description: z.string().min(1),
    totalAmount: z.number().positive(),
    payerId: z.string().min(1),
    groupId: z.string().min(1),
    splitType: z.literal("EQUAL"),
    memberIds: z.array(z.string()).min(1),
  }),
  z.object({
    description: z.string().min(1),
    totalAmount: z.number().positive(),
    payerId: z.string().min(1),
    groupId: z.string().min(1),
    splitType: z.literal("PERCENTAGE"),
    percentageMap: z.record(z.string(), z.number().positive()),
  }),
  z.object({
    description: z.string().min(1),
    totalAmount: z.number().positive(),
    payerId: z.string().min(1),
    groupId: z.string().min(1),
    splitType: z.literal("EXACT"),
    exactMap: z.record(z.string(), z.number().positive()),
  }),
]);

export class ExpenseController {
  constructor(
    private createExpenseUseCase: CreateExpenseUseCase,
    private getBalanceUseCase: GetBalanceUseCase,
  ) {}

  createExpense = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const parsed = CreateExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await this.createExpenseUseCase.execute(parsed.data);
    if (result.isFailure) {
      res.status(422).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true });
  };

  getBalance = async (
    req: Request<{ groupId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { groupId } = req.params;
    if (!groupId) {
      res.status(400).json({ success: false, error: "groupId is required" });
      return;
    }

    const result = await this.getBalanceUseCase.execute({ groupId });
    if (result.isFailure) {
      res.status(404).json({ success: false, error: result.error });
      return;
    }

    res.status(200).json({ success: true, data: result.getValue() });
  };
}
