import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="font-pixel text-pixel-xs text-pixel-gold uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={
            [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
            undefined
          }
          aria-invalid={error ? "true" : undefined}
          className={clsx(
            "bg-pixel-card border-2 px-4 py-3 font-vt text-vt-base text-pixel-text w-full",
            "focus:outline-none focus-visible:border-pixel-gold",
            "placeholder:text-pixel-muted",
            error
              ? "border-pixel-red shadow-pixel-red"
              : "border-pixel-border shadow-pixel-sm",
            "transition-colors duration-75",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="font-vt text-vt-sm text-pixel-muted">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="font-vt text-vt-sm text-pixel-red flex items-center gap-1"
          >
            <span aria-hidden="true">▶</span> {error}
          </p>
        )}
      </div>
    );
  },
);

PixelInput.displayName = "PixelInput";

// ── Select variant ────────────────────────────────────────

interface PixelSelectProps {
  label: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
}

export function PixelSelect({
  label,
  error,
  id,
  children,
  className,
  ...props
}: PixelSelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={selectId}
        className="font-pixel text-pixel-xs text-pixel-gold uppercase tracking-wider"
      >
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        className={clsx(
          "bg-pixel-card border-2 px-4 py-3 font-vt text-vt-base text-pixel-text w-full",
          "focus:outline-none focus-visible:border-pixel-gold",
          error
            ? "border-pixel-red shadow-pixel-red"
            : "border-pixel-border shadow-pixel-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="font-vt text-vt-sm text-pixel-red">
          <span aria-hidden="true">▶</span> {error}
        </p>
      )}
    </div>
  );
}

// ── Textarea variant ──────────────────────────────────────

interface PixelTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function PixelTextarea({ label, error, id, ...props }: PixelTextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-pixel text-pixel-xs text-pixel-gold uppercase tracking-wider"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        className={clsx(
          "bg-pixel-card border-2 px-4 py-3 font-vt text-vt-base text-pixel-text w-full resize-none",
          "focus:outline-none focus-visible:border-pixel-gold",
          error
            ? "border-pixel-red shadow-pixel-red"
            : "border-pixel-border shadow-pixel-sm",
        )}
        rows={3}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="font-vt text-vt-sm text-pixel-red">
          <span aria-hidden="true">▶</span> {error}
        </p>
      )}
    </div>
  );
}
