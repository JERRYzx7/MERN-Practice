export interface SplitProps {
  userId: string;
  amount: number; // 該用戶分攤的具體金額
}

export class Split {
  constructor(public readonly props: SplitProps) {}

  get userId(): string {
    return this.props.userId;
  }

  get amount(): number {
    return this.props.amount;
  }

  /**
   * 調整分攤金額（用於處理餘數分配）
   * @param newAmount 新的分攤金額
   * @returns 新的 Split 實例
   */
  public adjustAmount(newAmount: number): Split {
    return new Split({
      userId: this.props.userId,
      amount: Math.round(newAmount * 100) / 100,
    });
  }
}
