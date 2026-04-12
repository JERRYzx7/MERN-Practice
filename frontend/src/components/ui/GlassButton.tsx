import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-neon-teal to-emerald-500 text-gray-900 font-semibold shadow-glow-teal hover:shadow-glow-teal-lg hover:brightness-110 active:scale-[0.98]",
  secondary:
    "bg-neon-purple/15 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/25 hover:shadow-glow-purple active:scale-[0.98]",
  danger:
    "bg-neon-red/15 text-neon-red border border-neon-red/30 hover:bg-neon-red/25 hover:shadow-glow-red active:scale-[0.98]",
  success:
    "bg-neon-green/15 text-neon-green border border-neon-green/30 hover:bg-neon-green/25 hover:shadow-glow-green active:scale-[0.98]",
  ghost:
    "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled ?? loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer select-none",
          "focus-visible:outline-2 focus-visible:outline-neon-teal focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          isDisabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

GlassButton.displayName = "GlassButton";
