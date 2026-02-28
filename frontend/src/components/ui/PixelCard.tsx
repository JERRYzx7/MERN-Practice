import { type HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type CardVariant = "default" | "gold" | "green" | "red" | "dark";

interface PixelCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  title?: string;
  titleIcon?: string;
  noPadding?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-pixel-panel border-pixel-border shadow-pixel",
  gold: "bg-pixel-panel border-pixel-gold shadow-pixel-gold",
  green: "bg-pixel-panel border-pixel-green shadow-pixel-green",
  red: "bg-pixel-panel border-pixel-red shadow-pixel-red",
  dark: "bg-pixel-card border-pixel-border shadow-pixel",
};

export const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  (
    { variant = "default", title, titleIcon, noPadding, children, className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "border-2 relative",
          variantClasses[variant],
          !noPadding && "p-4",
          className,
        )}
        {...props}
      >
        {title && (
          <div className="border-b-2 border-current pb-3 mb-4 flex items-center gap-2">
            {titleIcon && (
              <span className="text-vt-lg" aria-hidden="true">
                {titleIcon}
              </span>
            )}
            <h2 className="font-pixel text-pixel-sm text-pixel-gold uppercase tracking-wider">
              {title}
            </h2>
          </div>
        )}
        {children}
      </div>
    );
  },
);

PixelCard.displayName = "PixelCard";
