import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-pixel text-[9px] text-slate-400 uppercase tracking-widest"
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
            "glass-input px-4 py-3 text-sm text-slate-100 w-full font-sans",
            "placeholder:text-slate-500",
            error && "border-neon-red/50 shadow-glow-red",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-neon-red flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

GlassInput.displayName = "GlassInput";

// ── Select variant ────────────────────────────────────────

interface GlassSelectProps {
  label: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
}

export function GlassSelect({
  label,
  error,
  id,
  children,
  className,
  ...props
}: GlassSelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className="font-pixel text-[9px] text-slate-400 uppercase tracking-widest"
      >
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        className={clsx(
          "glass-input px-4 py-3 text-sm text-slate-100 w-full font-sans",
          error && "border-neon-red/50 shadow-glow-red",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-neon-red">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Textarea variant ──────────────────────────────────────

interface GlassTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function GlassTextarea({ label, error, id, ...props }: GlassTextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-pixel text-[9px] text-slate-400 uppercase tracking-widest"
      >
        {label}
      </label>
      <textarea
        id={inputId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? "true" : undefined}
        className={clsx(
          "glass-input px-4 py-3 text-sm text-slate-100 w-full resize-none font-sans",
          error && "border-neon-red/50 shadow-glow-red",
        )}
        rows={3}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-neon-red">
          {error}
        </p>
      )}
    </div>
  );
}
