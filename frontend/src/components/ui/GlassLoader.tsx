import { GlassButton } from "./GlassButton";

interface GlassLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export function GlassLoader({
  text = "載入中",
  fullScreen = false,
}: GlassLoaderProps) {
  const inner = (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${text}...`}
      className="flex flex-col items-center gap-4"
    >
      {/* Orbiting dots spinner */}
      <div className="relative w-12 h-12" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border-2 border-white/5" />
        <div className="absolute inset-0 rounded-full border-2 border-t-neon-teal border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-neon-purple border-b-transparent border-l-transparent animate-spin-slow" style={{ animationDirection: "reverse" }} />
        <div className="absolute inset-[18px] rounded-full bg-neon-teal/20 animate-pulse" />
      </div>
      <p className="text-sm text-slate-400 font-medium">
        {text}
        <span className="animate-pulse ml-0.5">...</span>
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-50">
        {inner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-16">{inner}</div>;
}

// ── Empty state ───────────────────────────────────────────

interface GlassEmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function GlassEmpty({ icon, title, description }: GlassEmptyProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 py-16 text-center animate-fade-in"
    >
      {icon && (
        <span className="text-4xl animate-float" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 max-w-xs">{description}</p>
      )}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────

interface GlassErrorProps {
  message: string;
  onRetry?: () => void;
}

export function GlassError({ message, onRetry }: GlassErrorProps) {
  return (
    <div
      role="alert"
      className="glass-card border-neon-red/20 p-5 flex flex-col gap-3 animate-fade-in"
    >
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-neon-red flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <p className="font-pixel text-[9px] text-neon-red uppercase tracking-wider">
          錯誤
        </p>
      </div>
      <p className="text-sm text-slate-300">{message}</p>
      {onRetry && (
        <GlassButton
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="w-fit"
        >
          重試
        </GlassButton>
      )}
    </div>
  );
}
