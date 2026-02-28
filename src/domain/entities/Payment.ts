export interface PaymentProps {
  userId: string;
  amount: number;
  note?: string;
}

export class Payment {
  constructor(public readonly props: PaymentProps) {}

  get userId(): string {
    return this.props.userId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get note(): string | undefined {
    return this.props.note;
  }
}
