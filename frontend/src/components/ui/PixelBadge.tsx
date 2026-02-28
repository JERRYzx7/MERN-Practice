import { clsx } from "clsx";

type BadgeVariant = "gold" | "green" | "red" | "cyan" | "muted";

interface PixelBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  gold: "border-pixel-gold text-pixel-gold bg-pixel-gold/10",
  green: "border-pixel-green text-pixel-green bg-pixel-green/10",
  red: "border-pixel-red text-pixel-red bg-pixel-red/10",
  cyan: "border-pixel-cyan text-pixel-cyan bg-pixel-cyan/10",
  muted: "border-pixel-border text-pixel-muted bg-pixel-card",
};

export function PixelBadge({
  children,
  variant = "gold",
  className,
}: PixelBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block border-2 px-2 py-1 font-vt text-vt-sm",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Amount display ────────────────────────────────────────

interface AmountBadgeProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function AmountBadge({
  amount,
  currency = "$",
  className,
}: AmountBadgeProps) {
  const isPositive = amount >= 0;
  return (
    <span
      className={clsx(
        "font-vt text-vt-xl font-bold",
        isPositive ? "text-pixel-green" : "text-pixel-red",
        className,
      )}
      aria-label={`${isPositive ? "收入" : "支出"} ${currency}${Math.abs(amount).toFixed(2)}`}
    >
      {isPositive ? "+" : ""}
      {currency}
      {Math.abs(amount).toFixed(2)}
    </span>
  );
}
