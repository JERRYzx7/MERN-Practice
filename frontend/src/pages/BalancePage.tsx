import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useLocalGroups } from "@/hooks/useLocalGroups";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassLoader, GlassEmpty, GlassError } from "@/components/ui/GlassLoader";

export default function BalancePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId } = useAuthStore();
  const { groups } = useLocalGroups();
  const group = groups.find((g) => g.id === groupId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["balance", groupId],
    queryFn: () => groupApi.getBalance(groupId!),
    enabled: !!groupId,
  });

  const settlements = data?.data.settlements ?? [];
  const netBalances = data?.data.netBalances ?? {};
  const descriptions = data?.data.descriptions ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/groups/${groupId}`}
          className="text-slate-500 hover:text-neon-teal transition-colors p-1"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="font-pixel text-[11px] text-neon-teal tracking-wider">
          {group?.name ?? "群組"} — 結算
        </h1>
      </div>

      {isLoading && <GlassLoader text="計算中" />}

      {error && (
        <GlassError
          message={error instanceof Error ? error.message : "載入失敗"}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && settlements.length === 0 && (
        <GlassEmpty
          icon={<span className="text-3xl">🏆</span>}
          title="帳目完全清晰！"
          description="此群組目前沒有任何債務"
        />
      )}

      {/* Settlement table */}
      {settlements.length > 0 && (
        <GlassCard title="轉帳清單" variant="teal"
          titleIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        >
          <p className="text-xs text-slate-500 mb-4">
            最少轉帳次數結算方案
          </p>
          <ul className="space-y-3" role="list" aria-label="結算清單">
            {settlements.map((s, i) => {
              const isMe = s.from === userId;
              return (
                <li
                  key={i}
                  className={`glass-surface p-4 ${isMe ? "border-neon-red/20 glow-red" : ""}`}
                  aria-label={`${s.from.slice(0, 8)} 需支付 ${s.to.slice(0, 8)} $${s.amount.toFixed(2)}`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium ${s.from === userId ? "text-neon-red font-bold" : "text-slate-300"}`}
                      >
                        {s.from === userId ? "你" : s.from.slice(0, 10)}
                      </span>
                      <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span
                        className={`text-sm font-medium ${s.to === userId ? "text-neon-green font-bold" : "text-slate-300"}`}
                      >
                        {s.to === userId ? "你" : s.to.slice(0, 10)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg text-neon-amber font-bold">
                        ${s.amount.toFixed(2)}
                      </span>
                      {isMe && (
                        <GlassBadge variant="red">需支付</GlassBadge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      )}

      {/* Net balances */}
      {Object.keys(netBalances).length > 0 && (
        <GlassCard title="個人淨餘額"
          titleIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
        >
          <ul className="space-y-2" role="list" aria-label="各成員淨餘額">
            {Object.entries(netBalances).map(([uid, balance]) => (
              <li
                key={uid}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span
                  className={`text-sm ${uid === userId ? "text-neon-teal font-semibold" : "text-slate-300"}`}
                >
                  {uid === userId ? "你" : uid.slice(0, 12)}
                </span>
                <span
                  className={`font-mono text-sm font-bold ${balance >= 0 ? "text-neon-green" : "text-neon-red"}`}
                  aria-label={`${uid === userId ? "你" : uid} 淨餘額 ${balance >= 0 ? "正" : "負"} ${Math.abs(balance).toFixed(2)}`}
                >
                  {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Text descriptions */}
      {descriptions.length > 0 && (
        <GlassCard title="結算說明" variant="dark"
          titleIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        >
          <ul className="space-y-2" role="list">
            {descriptions.map((desc, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-neon-teal flex-shrink-0">•</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
