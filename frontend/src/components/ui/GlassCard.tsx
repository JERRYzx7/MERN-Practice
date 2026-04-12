import { type HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type CardVariant = "default" | "teal" | "green" | "red" | "dark" | "purple";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  title?: string;
  titleIcon?: React.ReactNode;
  noPadding?: boolean;
  glow?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: "glass-card",
  teal: "glass-card border-neon-teal/20 glow-teal",
  green: "glass-card border-neon-green/20 glow-green",
  red: "glass-card border-neon-red/20 glow-red",
  purple: "glass-card border-neon-purple/20 glow-purple",
  dark: "bg-brand-surface/80 border border-brand-border rounded-2xl",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { variant = "default", title, titleIcon, noPadding, glow, children, className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "relative animate-fade-in",
          variantClasses[variant],
          !noPadding && "p-5",
          glow && "animate-glow-pulse",
          className,
        )}
        {...props}
      >
        {title && (
          <div className="border-b border-white/5 pb-3 mb-4 flex items-center gap-2.5">
            {titleIcon && (
              <span className="text-neon-teal text-lg flex-shrink-0">
                {titleIcon}
              </span>
            )}
            <h2 className="font-pixel text-[10px] text-neon-teal uppercase tracking-widest">
              {title}
            </h2>
          </div>
        )}
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";
