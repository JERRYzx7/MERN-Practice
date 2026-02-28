import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { expenseApi } from "@/lib/api";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelLoader, PixelEmpty } from "@/components/ui/PixelLoader";
import type { ExpenseRecord } from "@/lib/api";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"] as const;

function formatMonth(y: number, m: number) {
  return `${y}/${String(m).padStart(2, "0")}`;
}

function toLocalDateStr(isoStr: string): string {
  // isoStr is "YYYY-MM-DDT..." UTC; convert to local date
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function groupByDay(expenses: ExpenseRecord[]): Map<string, ExpenseRecord[]> {
  const map = new Map<string, ExpenseRecord[]>();
  for (const exp of expenses) {
    const day = toLocalDateStr(exp.date);
    const arr = map.get(day) ?? [];
    arr.push(exp);
    map.set(day, arr);
  }
  // Sort days descending
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

const CATEGORY_ICONS: Record<string, string> = {
  // 支出
  餐飲: "🍽", 交通: "🚗", 住房: "🏠", 購物: "🛒", 娛樂: "🎮",
  醫療: "💊", 教育: "📚", 旅遊: "✈️", "3C": "💻", 禮物: "🎁", 工作: "💼", 運動: "🏋️",
  // 收入
  薪水: "💰", 獎金: "🎯", 股票: "📈", 副業: "💡", 租金: "🏡",
  退款: "💳", 禮金: "🧧", 其他收入: "✨",
};

export default function DashboardPage() {
  const { userName, personalGroupId } = useAuthStore();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<"ledger" | "chart">("ledger");

  // All personal expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", personalGroupId],
    queryFn: () => expenseApi.getByGroup(personalGroupId!),
    enabled: !!personalGroupId,
  });

  const allExpenses = expensesData?.data ?? [];

  // Filter to selected month
  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
  const monthExpenses = allExpenses.filter((e) => toLocalDateStr(e.date).startsWith(monthPrefix));
  const monthIncome  = monthExpenses.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const monthSpend   = monthExpenses.filter((e) => e.type !== "INCOME").reduce((s, e) => s + e.amount, 0);
  const monthNet     = monthIncome - monthSpend;   // positive = surplus, negative = deficit
  const grouped = groupByDay(monthExpenses);

  function prevMonth() {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  }
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1;

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
            <p className="font-vt text-vt-base text-pixel-muted">今天要記帳了嗎？</p>
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <p className="font-pixel text-pixel-xs text-pixel-muted mb-1">本月結餘</p>
                  {expensesLoading ? (
                    <span className="font-vt text-vt-lg text-pixel-muted animate-blink">計算中...</span>
                  ) : (
                    <span className={`font-vt text-vt-lg ${monthNet >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {monthNet >= 0 ? "+" : ""}{monthNet.toFixed(0)}{" "}
                      <span className="text-pixel-muted text-sm">TWD</span>
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-pixel text-pixel-xs text-pixel-muted mb-1">收入</p>
                  <span className="font-vt text-vt-base text-green-400">+{monthIncome.toFixed(0)}</span>
                </div>
                <div>
                  <p className="font-pixel text-pixel-xs text-pixel-muted mb-1">支出</p>
                  <span className="font-vt text-vt-base text-red-400">−{monthSpend.toFixed(0)}</span>
                </div>
              </div>
          </div>
          <div className="absolute right-4 top-4 text-5xl opacity-20 animate-float-pixel" aria-hidden="true">💰</div>
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="font-pixel text-pixel-xs text-pixel-muted mb-3 uppercase">
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

      {/* Tabs */}
      <section aria-label="記帳本與分析">
        {/* Tab header */}
        <div className="flex border-b-2 border-pixel-border mb-4" role="tablist">
          {(["ledger", "chart"] as const).map((tab) => {
            const labels = { ledger: "📒 記帳本", chart: "📊 分析" };
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-pixel text-pixel-xs transition-colors border-b-2 -mb-0.5 ${
                  activeTab === tab
                    ? "text-pixel-gold border-pixel-gold"
                    : "text-pixel-muted border-transparent hover:text-pixel-text"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab: Ledger */}
        {activeTab === "ledger" && (
          <div role="tabpanel">
            {expensesLoading ? (
              <PixelLoader text="載入支出記錄" />
            ) : (
              <>
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="font-pixel text-pixel-xs text-pixel-muted hover:text-pixel-gold px-3 py-2 border-2 border-pixel-border hover:border-pixel-gold transition-colors">
                    ◀
                  </button>
                  <div className="text-center">
                    <span className="font-pixel text-pixel-sm text-pixel-gold">
                      {formatMonth(viewYear, viewMonth)}
                    </span>
                    {monthExpenses.length > 0 && (
                      <p className={`font-vt text-vt-sm ${monthNet >= 0 ? "text-green-400" : "text-red-400"}`}>
                        結餘 {monthNet >= 0 ? "+" : ""}{monthNet.toFixed(0)} TWD
                      </p>
                    )}
                  </div>
                  <button
                    onClick={nextMonth}
                    disabled={isCurrentMonth}
                    className="font-pixel text-pixel-xs text-pixel-muted hover:text-pixel-gold px-3 py-2 border-2 border-pixel-border hover:border-pixel-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▶
                  </button>
                </div>

                {grouped.size === 0 ? (
                  <PixelEmpty icon="📒" title="本月尚無記錄" description="點擊「新增支出」開始記帳！" />
                ) : (
                  <div className="space-y-4">
                    {[...grouped.entries()].map(([day, exps]) => {
                      const d = new Date(day + "T00:00:00");
                      const dayNet = exps.reduce((s, e) => s + (e.type === "INCOME" ? e.amount : -e.amount), 0);
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      const wd = WEEKDAY[d.getDay()];
                      return (
                        <div key={day}>
                          {/* Day header */}
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="font-pixel text-pixel-xs text-pixel-gold">
                              {mm}/{dd}（{wd}）
                            </span>
                            <span className={`font-vt text-vt-sm ${dayNet >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {dayNet >= 0 ? "+" : ""}{dayNet.toFixed(0)}
                            </span>
                          </div>
                          <PixelCard>
                            <ul className="divide-y divide-pixel-border" role="list">
                              {exps.map((exp) => {
                                const isIncome = exp.type === "INCOME";
                                const icon = CATEGORY_ICONS[exp.category] ?? (isIncome ? "✨" : "💸");
                                return (
                                  <li key={exp.id} className="flex items-center gap-3 py-2">
                                    <span className="text-xl w-7 text-center flex-shrink-0" aria-hidden="true">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-vt text-vt-base text-pixel-text truncate">{exp.description}</p>
                                      {exp.category && !isIncome && (
                                        <p className="font-pixel text-[7px] text-pixel-muted">{exp.category}</p>
                                      )}
                                    </div>
                                    <span className={`font-vt text-vt-base font-bold flex-shrink-0 ${isIncome ? "text-green-400" : "text-red-400"}`}>
                                      {isIncome ? "+" : "−"}{exp.amount.toFixed(0)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </PixelCard>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Chart placeholder */}
        {activeTab === "chart" && (
          <div role="tabpanel">
            <PixelCard className="py-16 text-center">
              <div className="text-6xl mb-4" aria-hidden="true">📊</div>
              <p className="font-pixel text-pixel-sm text-pixel-gold mb-2">即將推出</p>
              <p className="font-vt text-vt-base text-pixel-muted">分類圓餅圖、月支出折線圖</p>
            </PixelCard>
          </div>
        )}
      </section>
    </div>
  );
}
