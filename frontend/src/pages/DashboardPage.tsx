import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { expenseApi } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassLoader, GlassEmpty } from "@/components/ui/GlassLoader";
import { GlassBadge } from "@/components/ui/GlassBadge";
import type { ExpenseRecord } from "@/lib/api";

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"] as const;

function formatMonth(y: number, m: number) {
  return `${y}/${String(m).padStart(2, "0")}`;
}

function toLocalDateStr(isoStr: string): string {
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
  return new Map([...map.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

const CATEGORY_ICONS: Record<string, string> = {
  餐飲: "🍽", 交通: "🚗", 住房: "🏠", 購物: "🛒", 娛樂: "🎮",
  醫療: "💊", 教育: "📚", 旅遊: "✈️", "3C": "💻", 禮物: "🎁", 工作: "💼", 運動: "🏋️",
  薪水: "💰", 獎金: "🎯", 股票: "📈", 副業: "💡", 租金: "🏡",
  退款: "💳", 禮金: "🧧", 其他收入: "✨",
};

export default function DashboardPage() {
  const { userName, personalGroupId } = useAuthStore();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<"ledger" | "chart">("ledger");

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", personalGroupId],
    queryFn: () => expenseApi.getByGroup(personalGroupId!),
    enabled: !!personalGroupId,
  });

  const allExpenses = expensesData?.data ?? [];

  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
  const monthExpenses = allExpenses.filter((e) => toLocalDateStr(e.date).startsWith(monthPrefix));
  const monthIncome  = monthExpenses.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const monthSpend   = monthExpenses.filter((e) => e.type !== "INCOME").reduce((s, e) => s + e.amount, 0);
  const monthNet     = monthIncome - monthSpend;
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
    <div className="space-y-6 animate-fade-in">
      {/* ── Hero: Isometric Illustration + Wallet Balance ── */}
      <section aria-labelledby="greeting-heading">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Isometric illustration */}
          <div className="relative">
            <img
              src="/hero-illustration.png"
              alt="SplitQuest 協作分帳場景"
              className="w-full h-auto rounded-2xl"
              loading="eager"
            />
            {/* Gradient overlay at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/40 to-transparent rounded-2xl" />
          </div>

          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
            <div>
              <h1
                id="greeting-heading"
                className="font-pixel text-[11px] text-neon-teal text-glow-teal tracking-wider mb-1"
              >
                歡迎回來，{userName ?? "冒險者"}
              </h1>
              <p className="text-sm text-slate-400">今天要記帳了嗎？</p>
            </div>

            {/* Balance summary */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">本月結餘</p>
                {expensesLoading ? (
                  <span className="text-sm text-slate-500 animate-pulse">計算中...</span>
                ) : (
                  <span className={`font-mono text-xl font-bold ${monthNet >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                    {monthNet >= 0 ? "+" : ""}{monthNet.toFixed(0)}
                    <span className="text-slate-500 text-xs ml-1">TWD</span>
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">收入</p>
                <span className="font-mono text-sm font-semibold text-neon-green">+{monthIncome.toFixed(0)}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">支出</p>
                <span className="font-mono text-sm font-semibold text-neon-red">−{monthSpend.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="font-pixel text-[9px] text-slate-500 mb-3 uppercase tracking-widest">
          快速操作
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link to="/groups">
            <GlassButton variant="ghost" fullWidth className="h-14 flex-col gap-1">
              <svg className="w-5 h-5 text-neon-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <span className="text-[10px] font-medium">查看群組</span>
            </GlassButton>
          </Link>
          <Link to={personalGroupId ? `/groups/${personalGroupId}/expense/new` : "/groups"}>
            <GlassButton variant="primary" fullWidth className="h-14 flex-col gap-1">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-[10px] font-medium">新增支出</span>
            </GlassButton>
          </Link>
          {personalGroupId && (
            <Link to={`/groups/${personalGroupId}/balance`} className="col-span-2 sm:col-span-1">
              <GlassButton variant="ghost" fullWidth className="h-14 flex-col gap-1">
                <svg className="w-5 h-5 text-neon-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <span className="text-[10px] font-medium">個人結算</span>
              </GlassButton>
            </Link>
          )}
        </div>
      </section>

      {/* ── Tabs ── */}
      <section aria-label="記帳本與分析">
        {/* Tab header */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4" role="tablist">
          {(["ledger", "chart"] as const).map((tab) => {
            const labels = { ledger: "記帳本", chart: "分析" };
            const icons = {
              ledger: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              ),
              chart: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              ),
            };
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === tab
                    ? "text-neon-teal bg-neon-teal/10 shadow-glow-teal"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {icons[tab]}
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab: Ledger */}
        {activeTab === "ledger" && (
          <div role="tabpanel" className="animate-fade-in">
            {expensesLoading ? (
              <GlassLoader text="載入支出記錄" />
            ) : (
              <>
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="text-sm text-slate-500 hover:text-neon-teal p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="text-center">
                    <span className="font-pixel text-[11px] text-neon-teal tracking-wider">
                      {formatMonth(viewYear, viewMonth)}
                    </span>
                    {monthExpenses.length > 0 && (
                      <p className={`font-mono text-xs mt-0.5 ${monthNet >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                        結餘 {monthNet >= 0 ? "+" : ""}{monthNet.toFixed(0)} TWD
                      </p>
                    )}
                  </div>
                  <button
                    onClick={nextMonth}
                    disabled={isCurrentMonth}
                    className="text-sm text-slate-500 hover:text-neon-teal p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                {grouped.size === 0 ? (
                  <GlassEmpty
                    icon={
                      <svg className="w-10 h-10 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                      </svg>
                    }
                    title="本月尚無記錄"
                    description="點擊「新增支出」開始記帳！"
                  />
                ) : (
                  <div className="space-y-4">
                    {[...grouped.entries()].map(([day, exps]) => {
                      const d = new Date(day + "T00:00:00");
                      const dayNet = exps.reduce((s, e) => s + (e.type === "INCOME" ? e.amount : -e.amount), 0);
                      const mm = String(d.getMonth() + 1).padStart(2, "0");
                      const dd = String(d.getDate()).padStart(2, "0");
                      const wd = WEEKDAY[d.getDay()];
                      return (
                        <div key={day} className="animate-slide-up">
                          {/* Day header */}
                          <div className="flex items-center justify-between px-1 mb-2">
                            <span className="font-pixel text-[9px] text-slate-500 tracking-wider">
                              {mm}/{dd}（{wd}）
                            </span>
                            <span className={`font-mono text-xs font-semibold ${dayNet >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                              {dayNet >= 0 ? "+" : ""}{dayNet.toFixed(0)}
                            </span>
                          </div>
                          <GlassCard>
                            <ul className="divide-y divide-white/5" role="list">
                              {exps.map((exp) => {
                                const isIncome = exp.type === "INCOME";
                                const icon = CATEGORY_ICONS[exp.category] ?? (isIncome ? "✨" : "💸");
                                return (
                                  <li key={exp.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="text-xl w-8 text-center flex-shrink-0" aria-hidden="true">{icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-200 truncate">{exp.description}</p>
                                      {exp.category && !isIncome && (
                                        <GlassBadge variant="muted" className="mt-1">{exp.category}</GlassBadge>
                                      )}
                                    </div>
                                    <span className={`font-mono text-sm font-bold flex-shrink-0 ${isIncome ? "text-neon-green" : "text-neon-red"}`}>
                                      {isIncome ? "+" : "−"}{exp.amount.toFixed(0)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </GlassCard>
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
          <div role="tabpanel" className="animate-fade-in">
            <GlassCard className="py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-12 h-12 text-slate-600 animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <p className="font-pixel text-[10px] text-neon-teal tracking-wider">即將推出</p>
                <p className="text-sm text-slate-500">分類圓餅圖、月支出折線圖</p>
              </div>
            </GlassCard>
          </div>
        )}
      </section>
    </div>
  );
}
