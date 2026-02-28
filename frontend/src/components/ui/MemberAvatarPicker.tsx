import type { Member } from "@/lib/api";

interface MemberAvatarPickerProps {
  members: Member[];
  selected: string[];
  onToggle: (userId: string) => void;
  label?: string;
}

export function MemberAvatarPicker({
  members,
  selected,
  onToggle,
  label = "選擇成員",
}: MemberAvatarPickerProps) {
  return (
    <div>
      {label && (
        <p className="font-pixel text-pixel-xs text-pixel-muted mb-3">{label}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {members.map((m) => {
          const isSelected = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              aria-pressed={isSelected}
              aria-label={m.name}
              className={[
                "flex flex-col items-center gap-1 p-2 rounded transition-all",
                "border-2 focus:outline-none focus:ring-2 focus:ring-pixel-gold",
                isSelected
                  ? "border-pixel-gold shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  : "border-pixel-border hover:border-pixel-gold/50",
              ].join(" ")}
            >
              {/* Avatar */}
              <div
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden",
                  isSelected ? "ring-2 ring-pixel-gold" : "",
                ].join(" ")}
                style={{ background: stringToColor(m.id) }}
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-pixel">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Name */}
              <span
                className={[
                  "font-pixel text-[8px] max-w-[48px] truncate",
                  isSelected ? "text-pixel-gold" : "text-pixel-muted",
                ].join(" ")}
              >
                {m.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Deterministic color from userId string */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 40%)`;
}
