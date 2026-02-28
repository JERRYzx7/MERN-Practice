interface PixelLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export function PixelLoader({
  text = "載入中",
  fullScreen = false,
}: PixelLoaderProps) {
  const inner = (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${text}...`}
      className="flex flex-col items-center gap-6"
    >
      {/* Pixel spinner made of CSS */}
      <div className="relative w-16 h-16" aria-hidden="true">
        <div className="absolute inset-0 border-4 border-pixel-border" />
        <div className="absolute inset-0 border-4 border-t-pixel-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-4 bg-pixel-gold/20 animate-blink" />
      </div>
      <p className="font-pixel text-pixel-xs text-pixel-gold animate-blink">
        {text}
        <span className="pixel-dots" aria-hidden="true" />
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-pixel-bg flex items-center justify-center z-50">
        {inner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{inner}</div>;
}

// ── Empty state ───────────────────────────────────────────

interface PixelEmptyProps {
  icon?: string;
  title: string;
  description?: string;
}

export function PixelEmpty({ icon = "📭", title, description }: PixelEmptyProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 py-12 text-center"
    >
      <span className="text-5xl animate-float-pixel" aria-hidden="true">
        {icon}
      </span>
      <p className="font-pixel text-pixel-sm text-pixel-muted">{title}</p>
      {description && (
        <p className="font-vt text-vt-base text-pixel-muted/70">{description}</p>
      )}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────

interface PixelErrorProps {
  message: string;
  onRetry?: () => void;
}

export function PixelError({ message, onRetry }: PixelErrorProps) {
  return (
    <div
      role="alert"
      className="border-2 border-pixel-red shadow-pixel-red p-4 bg-pixel-red/10 flex flex-col gap-3"
    >
      <p className="font-pixel text-pixel-xs text-pixel-red">
        ✕ 錯誤
      </p>
      <p className="font-vt text-vt-base text-pixel-text">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-pixel text-pixel-xs text-pixel-gold border-2 border-pixel-gold px-3 py-2 hover:bg-pixel-gold hover:text-black transition-colors w-fit"
        >
          重試
        </button>
      )}
    </div>
  );
}
