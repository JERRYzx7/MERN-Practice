import { clsx } from "clsx";

type BadgeVariant = "teal" | "green" | "red" | "purple" | "amber" | "sky" | "muted";

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

const badgeVariants: Record<BadgeVariant, string> = {
  teal: "bg-neon-teal/15 text-neon-teal border-neon-teal/25",
  green: "bg-neon-green/15 text-neon-green border-neon-green/25",
  red: "bg-neon-red/15 text-neon-red border-neon-red/25",
  purple: "bg-neon-purple/15 text-neon-purple border-neon-purple/25",
  amber: "bg-neon-amber/15 text-neon-amber border-neon-amber/25",
  sky: "bg-neon-sky/15 text-neon-sky border-neon-sky/25",
  muted: "bg-white/5 text-slate-400 border-white/10",
};

export function GlassBadge({
  children,
  variant = "teal",
  className,
  icon,
}: GlassBadgeProps) {
  return (
    <span
      className={clsx(
        "pill border",
        badgeVariants[variant],
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
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
        "font-mono text-2xl font-bold tracking-tight",
        isPositive ? "text-neon-green" : "text-neon-red",
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
