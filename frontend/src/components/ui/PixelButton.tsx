import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-pixel-gold text-black border-pixel-gold-dark shadow-pixel-gold hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none active:translate-y-[4px] active:translate-x-[4px] active:shadow-none",
  secondary:
    "bg-pixel-cyan text-black border-pixel-cyan hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#0891b2] active:translate-y-[4px] active:translate-x-[4px]",
  danger:
    "bg-pixel-red text-black border-[#dc2626] shadow-pixel-red hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none active:translate-y-[4px] active:translate-x-[4px] active:shadow-none",
  success:
    "bg-pixel-green text-black border-[#16a34a] shadow-pixel-green hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none active:translate-y-[4px] active:translate-x-[4px] active:shadow-none",
  ghost:
    "bg-transparent text-pixel-text border-pixel-border shadow-pixel hover:bg-pixel-panel hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-pixel-xs",
  md: "px-4 py-3 text-pixel-sm",
  lg: "px-6 py-4 text-pixel-base",
};

export const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
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
          "font-pixel border-2 transition-all duration-75 cursor-pointer select-none",
          "focus-visible:outline-4 focus-visible:outline-pixel-gold",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed translate-x-0 translate-y-0 shadow-pixel",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-blink">▮</span>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

PixelButton.displayName = "PixelButton";
