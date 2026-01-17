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
}
