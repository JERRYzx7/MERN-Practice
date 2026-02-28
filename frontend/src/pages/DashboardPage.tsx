import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { groupApi, expenseApi } from "@/lib/api";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelLoader, PixelEmpty } from "@/components/ui/PixelLoader";
import { AmountBadge } from "@/components/ui/PixelBadge";

export default function DashboardPage() {
  const { userName, userId, personalGroupId } = useAuthStore();

  // Personal group balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["balance", personalGroupId],
    queryFn: () => groupApi.getBalance(personalGroupId!),
    enabled: !!personalGroupId,
  });

  // Recent personal expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", personalGroupId],
    queryFn: () => expenseApi.getByGroup(personalGroupId!),
    enabled: !!personalGroupId,
  });

  const myBalance = balanceData?.data.netBalances[userId!] ?? 0;
  const recentExpenses = (expensesData?.data ?? []).slice(-5).reverse();
  const isLoading = balanceLoading || expensesLoading;

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <section aria-labelledby="greeting-heading">
        <div className="border-2 border-pixel-gold shadow-pixel-gold bg-pixel-panel p-6 relative overflow-hidden scanlines">
          <div className="relative z-[2]">
            <h1
              id="greeting-heading"
              className="font-pixel text-pixel-base text-pixel-gold text-shadow-pixel mb-2"
            >
              ▶ 歡迎回來，{userName ?? "冒險者"}！
            </h1>
            <p className="font-vt text-vt-base text-pixel-muted">
              今天要記帳了嗎？
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div>
                <p className="font-pixel text-pixel-xs text-pixel-muted mb-1">個人結餘</p>
                {balanceLoading ? (
                  <span className="font-vt text-vt-lg text-pixel-muted animate-blink">
                    計算中...
                  </span>
                ) : (
                  <AmountBadge amount={myBalance} />
                )}
              </div>
            </div>
          </div>
          <div
            className="absolute right-4 top-4 text-5xl opacity-20 animate-float-pixel"
            aria-hidden="true"
          >
            💰
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="font-pixel text-pixel-xs text-pixel-muted mb-3 uppercase"
        >
          快速操作
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link to="/groups">
            <PixelButton variant="ghost" fullWidth className="h-16 flex-col gap-1">
              <span className="text-2xl" aria-hidden="true">⊕</span>
              <span className="font-pixel text-[8px]">查看群組</span>
            </PixelButton>
          </Link>
          <Link to={personalGroupId ? `/groups/${personalGroupId}/expense/new` : "/groups"}>
            <PixelButton variant="secondary" fullWidth className="h-16 flex-col gap-1">
              <span className="text-2xl" aria-hidden="true">＋</span>
              <span className="font-pixel text-[8px]">新增支出</span>
            </PixelButton>
          </Link>
          {personalGroupId && (
            <Link to={`/groups/${personalGroupId}/balance`} className="col-span-2 sm:col-span-1">
              <PixelButton variant="ghost" fullWidth className="h-16 flex-col gap-1">
                <span className="text-2xl" aria-hidden="true">⚖</span>
                <span className="font-pixel text-[8px]">個人結算</span>
              </PixelButton>
            </Link>
          )}
        </div>
      </section>

      {/* Recent personal expenses */}
      <section aria-labelledby="recent-expenses-heading">
        <h2
          id="recent-expenses-heading"
          className="font-pixel text-pixel-xs text-pixel-muted mb-3 uppercase"
        >
          最近支出
        </h2>
        {expensesLoading ? (
          <PixelLoader text="載入支出記錄" />
        ) : recentExpenses.length === 0 ? (
          <PixelEmpty
            icon="📒"
            title="尚無支出記錄"
            description="點擊「新增支出」開始記帳！"
          />
        ) : (
          <PixelCard title="個人記帳本" titleIcon="📒">
            <ul className="space-y-3" role="list">
              {recentExpenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex items-center justify-between py-2 border-b border-pixel-border last:border-0"
                >
                  <span className="font-vt text-vt-base text-pixel-text">
                    {exp.description}
                  </span>
                  <span className="font-vt text-vt-lg text-pixel-gold font-bold">
                    {exp.currency} {exp.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </PixelCard>
        )}
      </section>

      {!isLoading && (
        <PixelEmpty
          icon="✨"
          title="帳目清晰！"
          description="目前沒有待結算的項目"
        />
      )}

      {isLoading && <PixelLoader text="載入結餘資料" />}
    </div>
  );
}
