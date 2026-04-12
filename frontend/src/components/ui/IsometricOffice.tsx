import type { Member } from "@/lib/api";

interface IsometricOfficeProps {
  members: Member[];
  currentUserId?: string | null;
  netBalances?: Record<string, number>;
}

// ── Desk layout positions (isometric grid) ────────────────
// Each desk has a grid position [col, row] mapped to pixel offsets
const DESK_SLOTS = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 0, row: 2 },
  { col: 1, row: 2 },
  { col: 2, row: 2 },
  { col: 0, row: 3 },
  { col: 1, row: 3 },
  { col: 2, row: 3 },
];

// Desk accent colors - each member gets a unique color
const DESK_COLORS = [
  { bg: "#2dd4bf", label: "bg-neon-teal/80", glow: "rgba(45,212,191,0.3)" },
  { bg: "#a78bfa", label: "bg-neon-purple/80", glow: "rgba(167,139,250,0.3)" },
  { bg: "#fb7185", label: "bg-neon-red/80", glow: "rgba(251,113,133,0.3)" },
  { bg: "#fbbf24", label: "bg-neon-amber/80", glow: "rgba(251,191,36,0.3)" },
  { bg: "#38bdf8", label: "bg-neon-sky/80", glow: "rgba(56,189,248,0.3)" },
  { bg: "#34d399", label: "bg-neon-green/80", glow: "rgba(52,211,153,0.3)" },
  { bg: "#f472b6", label: "bg-pink-400/80", glow: "rgba(244,114,182,0.3)" },
  { bg: "#818cf8", label: "bg-indigo-400/80", glow: "rgba(129,140,248,0.3)" },
  { bg: "#fb923c", label: "bg-orange-400/80", glow: "rgba(251,146,60,0.3)" },
  { bg: "#a3e635", label: "bg-lime-400/80", glow: "rgba(163,230,53,0.3)" },
  { bg: "#22d3ee", label: "bg-cyan-400/80", glow: "rgba(34,211,238,0.3)" },
  { bg: "#e879f9", label: "bg-fuchsia-400/80", glow: "rgba(232,121,249,0.3)" },
];

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return `hsl(${Math.abs(h) % 360}, 55%, 35%)`;
}

export function IsometricOffice({
  members,
  currentUserId,
  netBalances = {},
}: IsometricOfficeProps) {
  const visibleMembers = members.slice(0, DESK_SLOTS.length);

  // Calculate grid dimensions based on members
  const rows = Math.ceil(visibleMembers.length / 3);
  const cellW = 120;
  const cellH = 70;
  const offsetX = 200; // center offset
  const offsetY = 40;
  const totalW = Math.max(420, cellW * 3 + offsetX);
  const totalH = Math.max(180, rows * cellH + offsetY + 100);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        background: "linear-gradient(180deg, #0c1225 0%, #0a0e1e 100%)",
        minHeight: `${totalH}px`,
      }}
      role="img"
      aria-label={`群組辦公室，${visibleMembers.length} 位成員在工作中`}
    >
      {/* Isometric grid floor */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="iso-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(45,212,191,0.12)"
              strokeWidth="0.5"
            />
          </pattern>
          {/* Lamp glow */}
          <radialGradient id="lamp-glow">
            <stop offset="0%" stopColor="rgba(45,212,191,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Floor grid */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#iso-grid)" />

        {/* Ambient ceiling lamps */}
        {[0, 1, 2].slice(0, Math.min(3, Math.ceil(visibleMembers.length / 2))).map((i) => (
          <g key={`lamp-${i}`}>
            <circle
              cx={100 + i * 140}
              cy={20}
              r={50}
              fill="url(#lamp-glow)"
            />
            {/* Lamp fixture */}
            <rect
              x={95 + i * 140}
              y={8}
              width={10}
              height={3}
              rx={1}
              fill="rgba(45,212,191,0.4)"
            />
            <line
              x1={100 + i * 140}
              y1={11}
              x2={100 + i * 140}
              y2={18}
              stroke="rgba(45,212,191,0.25)"
              strokeWidth={1}
            />
            <circle
              cx={100 + i * 140}
              cy={20}
              r={3}
              fill="rgba(45,212,191,0.5)"
            />
          </g>
        ))}

        {/* Decorative plants */}
        {visibleMembers.length > 0 && (
          <>
            <g transform={`translate(${totalW - 50}, ${totalH - 45})`}>
              <rect x={-3} y={10} width={8} height={12} rx={1} fill="#5b4a3a" />
              <ellipse cx={1} cy={8} rx={10} ry={10} fill="#22543d" />
              <ellipse cx={-4} cy={5} rx={6} ry={7} fill="#276749" />
              <ellipse cx={5} cy={3} rx={5} ry={6} fill="#2f855a" />
            </g>
            <g transform={`translate(20, ${totalH - 40})`}>
              <rect x={-2} y={8} width={6} height={10} rx={1} fill="#5b4a3a" />
              <ellipse cx={1} cy={6} rx={8} ry={8} fill="#22543d" />
              <ellipse cx={-3} cy={3} rx={5} ry={6} fill="#276749" />
            </g>
          </>
        )}
      </svg>

      {/* Desks + Members */}
      <div className="relative" style={{ minHeight: `${totalH}px` }}>
        {visibleMembers.map((member, idx) => {
          const slot = DESK_SLOTS[idx];
          const color = DESK_COLORS[idx % DESK_COLORS.length];
          const isMe = member.id === currentUserId;

          // Isometric-ish positioning
          const x = offsetX / 2 + slot.col * cellW;
          const y = offsetY + slot.row * cellH;

          return (
            <div
              key={member.id}
              className="absolute transition-all duration-500 ease-out"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${cellW}px`,
                animation: `fadeIn 0.4s ease-out ${idx * 0.08}s both`,
              }}
            >
              {/* Desk surface */}
              <div className="relative flex flex-col items-center">
                {/* Monitor */}
                <div
                  className="w-10 h-7 rounded-sm border border-white/10 mb-0.5 flex flex-col items-center justify-center gap-0.5"
                  style={{
                    background: "linear-gradient(180deg, #1a2332 0%, #0f172a 100%)",
                    boxShadow: `0 0 8px ${color.glow}`,
                  }}
                >
                  {/* Screen content - balance display */}
                  {(() => {
                    const bal = netBalances[member.id];
                    if (bal === undefined || bal === 0) {
                      return (
                        <>
                          <div className="text-[6px] text-slate-500 leading-none">NET</div>
                          <div className="text-[7px] font-mono font-bold text-slate-400 leading-none">±0</div>
                        </>
                      );
                    }
                    const isPos = bal > 0;
                    const label = isPos ? `+${Math.round(bal)}` : `${Math.round(bal)}`;
                    const clr = isPos ? "#34d399" : "#fb7185";
                    return (
                      <>
                        <div className="text-[6px] leading-none" style={{ color: clr, opacity: 0.7 }}>
                          {isPos ? "被欠" : "欠款"}
                        </div>
                        <div className="text-[8px] font-mono font-bold leading-none" style={{ color: clr }}>
                          {label}
                        </div>
                      </>
                    );
                  })()}
                </div>
                {/* Monitor stand */}
                <div className="w-1 h-1.5" style={{ background: "#374151" }} />

                {/* Desk */}
                <div
                  className="w-16 h-3 rounded-sm"
                  style={{
                    background: "linear-gradient(180deg, #92643a 0%, #7a5430 100%)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  }}
                />

                {/* Character (sitting at desk) */}
                <div
                  className="absolute -top-1 flex flex-col items-center"
                  style={{ transform: "translateY(-100%)" }}
                >
                  {/* Name tag pill */}
                  <div
                    className="px-2 py-0.5 rounded-full text-[8px] font-bold text-white mb-1 whitespace-nowrap shadow-lg"
                    style={{
                      background: color.bg,
                      boxShadow: `0 0 10px ${color.glow}`,
                      maxWidth: "80px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {isMe ? `${member.name} ★` : member.name}
                  </div>

                  {/* Avatar head */}
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center overflow-hidden"
                    style={{
                      borderColor: color.bg,
                      background: member.avatarUrl ? undefined : hashColor(member.id),
                      boxShadow: isMe ? `0 0 12px ${color.glow}` : undefined,
                    }}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-[8px] font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Body (simplified pixel-ish character) */}
                  <div
                    className="w-4 h-3 rounded-b-sm -mt-0.5"
                    style={{ background: color.bg, opacity: 0.7 }}
                  />
                </div>

                {/* Chair */}
                <div
                  className="w-8 h-2 rounded-t-sm -mt-0.5"
                  style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.05)" }}
                />
              </div>
            </div>
          );
        })}

        {/* Empty desk slots (show available space) */}
        {visibleMembers.length < 6 && visibleMembers.length > 0 && (
          <div
            className="absolute transition-all duration-500 opacity-30"
            style={{
              left: `${offsetX / 2 + DESK_SLOTS[visibleMembers.length].col * cellW}px`,
              top: `${offsetY + DESK_SLOTS[visibleMembers.length].row * cellH}px`,
              width: `${cellW}px`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-10 h-7 rounded-sm border border-dashed border-white/10 mb-0.5 flex items-center justify-center">
                <span className="text-[8px] text-slate-600">?</span>
              </div>
              <div className="w-1 h-1.5 bg-gray-800" />
              <div className="w-16 h-3 rounded-sm bg-gray-800/50 border border-dashed border-white/5" />
              <div className="text-[7px] text-slate-600 mt-1">空位</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
