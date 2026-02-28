/** 等額平分：傳入要平分的成員 ID 清單 */
interface EqualSplitDTO {
  splitType: "EQUAL";
  memberIds: string[];
}

/** 百分比分帳：傳入每位成員的百分比（總和須為 100） */
interface PercentageSplitDTO {
  splitType: "PERCENTAGE";
  percentageMap: Record<string, number>;
}

/** 指定金額分帳：傳入每位成員的實際金額（總和須等於 totalAmount） */
interface ExactSplitDTO {
  splitType: "EXACT";
  exactMap: Record<string, number>;
}

type SplitDataDTO = EqualSplitDTO | PercentageSplitDTO | ExactSplitDTO;

export interface PaymentDTO {
  userId: string;
  amount: number;
  note?: string | undefined;
}

/** 建立支出的輸入 DTO（discriminated union 確保型別安全） */
export type CreateExpenseDTO = {
  description: string;
  currency?: string;
  /** 多付款人；totalAmount = sum(payments.map(p => p.amount)) */
  payments: PaymentDTO[];
  groupId: string;
} & SplitDataDTO;
