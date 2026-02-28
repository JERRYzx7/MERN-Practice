import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { groupApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useLocalGroups } from "@/hooks/useLocalGroups";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { PixelLoader, PixelEmpty, PixelError } from "@/components/ui/PixelLoader";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/groups/${groupId}`}
          className="font-pixel text-pixel-xs text-pixel-muted hover:text-pixel-gold transition-colors"
        >
          ◀ 返回
        </Link>
        <h1 className="font-pixel text-pixel-sm text-pixel-gold">
          ⚖ {group?.name ?? "群組"} — 結算
        </h1>
      </div>

      {isLoading && <PixelLoader text="計算中" />}

      {error && (
        <PixelError
          message={error instanceof Error ? error.message : "載入失敗"}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !error && settlements.length === 0 && (
        <PixelEmpty
          icon="🏆"
          title="帳目完全清晰！"
          description="此群組目前沒有任何債務"
        />
      )}

      {/* Settlement table */}
      {settlements.length > 0 && (
        <PixelCard title="轉帳清單" titleIcon="💸" variant="gold">
          <p className="font-pixel text-pixel-xs text-pixel-muted mb-4">
            最少轉帳次數結算方案
          </p>
          <ul className="space-y-3" role="list" aria-label="結算清單">
            {settlements.map((s, i) => {
              const isMe = s.from === userId;
              return (
                <li
                  key={i}
                  className={`border-2 p-4 ${isMe ? "border-pixel-red bg-pixel-red/5" : "border-pixel-border"}`}
                  aria-label={`${s.from.slice(0, 8)} 需支付 ${s.to.slice(0, 8)} $${s.amount.toFixed(2)}`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-vt text-vt-base ${s.from === userId ? "text-pixel-red font-bold" : "text-pixel-text"}`}
                      >
                        {s.from === userId ? "▶ 你" : s.from.slice(0, 10)}
                      </span>
                      <span className="font-pixel text-pixel-xs text-pixel-muted">
                        →
                      </span>
                      <span
                        className={`font-vt text-vt-base ${s.to === userId ? "text-pixel-green font-bold" : "text-pixel-text"}`}
                      >
                        {s.to === userId ? "▶ 你" : s.to.slice(0, 10)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-vt text-vt-xl text-pixel-gold font-bold">
                        ${s.amount.toFixed(2)}
                      </span>
                      {isMe && (
                        <PixelBadge variant="red">需支付</PixelBadge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </PixelCard>
      )}

      {/* Net balances */}
      {Object.keys(netBalances).length > 0 && (
        <PixelCard title="個人淨餘額" titleIcon="📊">
          <ul className="space-y-2" role="list" aria-label="各成員淨餘額">
            {Object.entries(netBalances).map(([uid, balance]) => (
              <li
                key={uid}
                className="flex items-center justify-between py-2 border-b border-pixel-border last:border-0"
              >
                <span
                  className={`font-vt text-vt-base ${uid === userId ? "text-pixel-gold" : "text-pixel-text"}`}
                >
                  {uid === userId ? "▶ 你" : uid.slice(0, 12)}
                </span>
                <span
                  className={`font-vt text-vt-lg font-bold ${balance >= 0 ? "text-pixel-green" : "text-pixel-red"}`}
                  aria-label={`${uid === userId ? "你" : uid} 淨餘額 ${balance >= 0 ? "正" : "負"} ${Math.abs(balance).toFixed(2)}`}
                >
                  {balance >= 0 ? "+" : ""}${balance.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </PixelCard>
      )}

      {/* Text descriptions */}
      {descriptions.length > 0 && (
        <PixelCard title="結算說明" titleIcon="📜" variant="dark">
          <ul className="space-y-2" role="list">
            {descriptions.map((desc, i) => (
              <li key={i} className="font-vt text-vt-base text-pixel-text flex gap-2">
                <span className="text-pixel-gold" aria-hidden="true">▶</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </PixelCard>
      )}
    </div>
  );
}
