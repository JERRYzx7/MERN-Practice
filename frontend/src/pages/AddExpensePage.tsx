import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { expenseApi, userApi, ApiError, type PaymentRecord } from "@/lib/api";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { MemberAvatarPicker } from "@/components/ui/MemberAvatarPicker";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

type SplitMode = "EQUAL" | "PERCENTAGE" | "EXACT";

const SPLIT_MODE_LABELS: Record<SplitMode, { label: string; icon: string }> = {
  EQUAL: { label: "等額平分", icon: "=" },
  PERCENTAGE: { label: "百分比", icon: "%" },
  EXACT: { label: "指定金額", icon: "$" },
};

const EXPENSE_CATEGORIES = [
  { key: "food",          label: "餐飲",    icon: "🍽" },
  { key: "transport",     label: "交通",    icon: "🚗" },
  { key: "housing",       label: "住房",    icon: "🏠" },
  { key: "shopping",      label: "購物",    icon: "🛒" },
  { key: "entertainment", label: "娛樂",    icon: "🎮" },
  { key: "health",        label: "醫療",    icon: "💊" },
  { key: "education",     label: "教育",    icon: "📚" },
  { key: "travel",        label: "旅遊",    icon: "✈️" },
  { key: "tech",          label: "3C",      icon: "💻" },
  { key: "gift",          label: "禮物",    icon: "🎁" },
  { key: "work",          label: "工作",    icon: "💼" },
  { key: "sports",        label: "運動",    icon: "🏋️" },
];

const INCOME_CATEGORIES = [
  { key: "salary",        label: "薪水",    icon: "💰" },
  { key: "bonus",         label: "獎金",    icon: "🎯" },
  { key: "stocks",        label: "股票",    icon: "📈" },
  { key: "side",          label: "副業",    icon: "💡" },
  { key: "rent",          label: "租金",    icon: "🏡" },
  { key: "refund",        label: "退款",    icon: "💳" },
  { key: "hongbao",       label: "禮金",    icon: "🧧" },
  { key: "other-income",  label: "其他收入", icon: "✨" },
];

const MAX_CUSTOM = 87;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface PaymentRow {
  userId: string;
  amount: string;
  note: string;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeCustomCategories(
  value: unknown,
): { expense: string[]; income: string[] } {
  if (!value || typeof value !== "object") return { expense: [], income: [] };
  const raw = value as { expense?: unknown; income?: unknown };
  return {
    expense: normalizeStringArray(raw.expense),
    income: normalizeStringArray(raw.income),
  };
}

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId, personalGroupId, customCategories: storeCategories, updateUserInfo } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isPersonal = groupId === personalGroupId;
  const { data: members = [] } = useGroupMembers(isPersonal ? undefined : groupId);

  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [entryType, setEntryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [category, setCategory] = useState("");
  const [customInput, setCustomInput] = useState("");

  const normalizedCategories = normalizeCustomCategories(storeCategories);
  const customCategories = entryType === "INCOME" ? normalizedCategories.income : normalizedCategories.expense;

  function switchEntryType(t: "EXPENSE" | "INCOME") {
    setEntryType(t);
    setCategory("");
  }

  async function addCustomCategory(name: string) {
    if (!name || customCategories.includes(name) || customCategories.length >= MAX_CUSTOM) return;
    const updated = {
      expense: entryType === "EXPENSE" ? [...normalizedCategories.expense, name] : normalizedCategories.expense,
      income:  entryType === "INCOME"  ? [...normalizedCategories.income,  name] : normalizedCategories.income,
    };
    try {
      await userApi.updateProfile({ customCategories: updated });
      updateUserInfo({ customCategories: updated });
    } catch {
      updateUserInfo({ customCategories: updated });
    }
  }

  const [personalAmount, setPersonalAmount] = useState("");
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    { userId: userId ?? "", amount: "", note: "" },
  ]);
  const [splitMembers, setSplitMembers] = useState<string[]>([userId ?? ""]);
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [percentageMap, setPercentageMap] = useState<Record<string, string>>({});
  const [exactMap, setExactMap] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const totalPaid = paymentRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  function toggleSplitMember(id: string) {
    setSplitMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function updateRow(idx: number, field: keyof PaymentRow, value: string) {
    setPaymentRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setPaymentRows((prev) => [...prev, { userId: "", amount: "", note: "" }]);
  }

  function removeRow(idx: number) {
    setPaymentRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!description.trim()) e["description"] = "請輸入描述";

    if (isPersonal) {
      const amt = parseFloat(personalAmount);
      if (!personalAmount || isNaN(amt) || amt <= 0) e["amount"] = "請輸入正確金額";
    } else {
      paymentRows.forEach((r, i) => {
        if (!r.userId) e[`pay-user-${i}`] = "請選擇付款人";
        const amt = parseFloat(r.amount);
        if (!r.amount || isNaN(amt) || amt <= 0) e[`pay-amt-${i}`] = "請輸入金額";
      });
      if (splitMembers.length === 0) e["splitMembers"] = "請選擇分攤成員";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        description: description.trim(),
        groupId: groupId!,
        date: expenseDate,
        category: category || undefined,
        type: isPersonal ? entryType : "EXPENSE" as const,
      };

      if (isPersonal) {
        const amt = parseFloat(personalAmount);
        return expenseApi.create({
          ...base,
          payments: [{ userId: userId!, amount: amt }],
          splitType: "EQUAL",
          memberIds: [userId!],
        });
      }

      const payments: PaymentRecord[] = paymentRows
        .filter((r) => r.userId && parseFloat(r.amount) > 0)
        .map((r) => ({
          userId: r.userId,
          amount: parseFloat(r.amount),
          ...(r.note.trim() ? { note: r.note.trim() } : {}),
        }));

      if (splitMode === "EQUAL") {
        return expenseApi.create({ ...base, payments, splitType: "EQUAL", memberIds: splitMembers });
      }

      if (splitMode === "PERCENTAGE") {
        const pct: Record<string, number> = {};
        splitMembers.forEach((id) => {
          const v = parseFloat(percentageMap[id] ?? "0");
          if (v > 0) pct[id] = v;
        });
        return expenseApi.create({ ...base, payments, splitType: "PERCENTAGE", percentageMap: pct });
      }

      const exact: Record<string, number> = {};
      splitMembers.forEach((id) => {
        const v = parseFloat(exactMap[id] ?? "0");
        if (v > 0) exact[id] = v;
      });
      return expenseApi.create({ ...base, payments, splitType: "EXACT", exactMap: exact });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses", groupId] });
      navigate(isPersonal ? "/dashboard" : `/groups/${groupId}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) setApiError(err.message);
    },
  });

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiError("");
    if (validate()) mutation.mutate();
  }

  const backTo = isPersonal ? "/dashboard" : `/groups/${groupId}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={backTo} className="text-slate-500 hover:text-neon-teal transition-colors p-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="font-pixel text-[11px] text-neon-teal tracking-wider">
          {isPersonal ? "記帳" : "新增支出"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="新增支出表單">
        <div className="space-y-4">

          {/* Income / Expense toggle */}
          {isPersonal && (
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl" role="group" aria-label="記錄類型">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchEntryType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    entryType === t
                      ? t === "EXPENSE"
                        ? "text-neon-red bg-neon-red/10"
                        : "text-neon-green bg-neon-green/10"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t === "EXPENSE" ? "支出" : "收入"}
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          <GlassCard
            title={isPersonal && entryType === "INCOME" ? "收入資訊" : "支出資訊"}
            titleIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          >
            <GlassInput
              label="描述"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors["description"]}
              placeholder={isPersonal && entryType === "INCOME" ? "薪資、獎金、副業收入..." : isPersonal ? "咖啡、午餐、交通..." : "晚餐、機票、住宿..."}
              required
              autoFocus
            />
          </GlassCard>

          {/* Date */}
          <GlassCard title="日期"
            titleIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          >
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="glass-input px-4 py-3 text-sm text-slate-100 w-full"
            />
          </GlassCard>

          {/* Category */}
          <GlassCard title="分類"
            titleIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            }
          >
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCategory("")}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200 cursor-pointer border ${
                  category === ""
                    ? "border-neon-teal/30 text-neon-teal bg-neon-teal/10"
                    : "border-white/5 text-slate-500 hover:border-white/10"
                }`}
              >
                <span className="text-lg">—</span>
                <span className="text-[9px] font-medium">未分類</span>
              </button>

              {(entryType === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.label)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200 cursor-pointer border ${
                    category === c.label
                      ? "border-neon-teal/30 text-neon-teal bg-neon-teal/10"
                      : "border-white/5 text-slate-500 hover:border-white/10"
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-[9px] font-medium">{c.label}</span>
                </button>
              ))}

              {customCategories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200 cursor-pointer border ${
                    category === name
                      ? "border-neon-teal/30 text-neon-teal bg-neon-teal/10"
                      : "border-white/5 text-slate-500 hover:border-white/10"
                  }`}
                >
                  <span className="text-lg">🏷</span>
                  <span className="text-[9px] font-medium truncate w-full text-center">{name}</span>
                </button>
              ))}
            </div>

            {customCategories.length < MAX_CUSTOM && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="自訂分類名稱"
                  maxLength={20}
                  className="glass-input flex-1 px-3 py-2 text-sm text-slate-100"
                />
                <button
                  type="button"
                  disabled={!customInput.trim()}
                  onClick={async () => {
                    const name = customInput.trim();
                    if (!name) return;
                    await addCustomCategory(name);
                    setCategory(name);
                    setCustomInput("");
                  }}
                  className="border border-white/10 px-3 py-2 text-xs text-slate-500 hover:border-neon-teal/30 hover:text-neon-teal disabled:opacity-40 transition-all rounded-xl cursor-pointer"
                >
                  + 儲存
                </button>
              </div>
            )}
          </GlassCard>

          {/* Personal: simple amount */}
          {isPersonal && (
            <GlassCard title="金額"
              titleIcon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              }
            >
              <GlassInput
                label="金額（TWD）"
                type="number"
                value={personalAmount}
                onChange={(e) => setPersonalAmount(e.target.value)}
                error={errors["amount"]}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </GlassCard>
          )}

          {/* Group: payment rows */}
          {!isPersonal && (
            <>
              <GlassCard title="付款人"
                titleIcon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                }
              >
                <div className="space-y-3">
                  {paymentRows.map((row, idx) => (
                    <div key={idx} className="space-y-2 glass-surface p-3">
                      <MemberAvatarPicker
                        members={members}
                        selected={row.userId ? [row.userId] : []}
                        onToggle={(id) => updateRow(idx, "userId", row.userId === id ? "" : id)}
                        label={`付款人 ${idx + 1}`}
                      />
                      {errors[`pay-user-${idx}`] && (
                        <p className="text-xs text-neon-red">{errors[`pay-user-${idx}`]}</p>
                      )}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <GlassInput
                            label="金額"
                            type="number"
                            value={row.amount}
                            onChange={(e) => updateRow(idx, "amount", e.target.value)}
                            error={errors[`pay-amt-${idx}`]}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                          />
                        </div>
                        <div className="flex-1">
                          <GlassInput
                            label="備註（選填）"
                            type="text"
                            value={row.note}
                            onChange={(e) => updateRow(idx, "note", e.target.value)}
                            placeholder="飲料、餐點..."
                          />
                        </div>
                        {paymentRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="self-end mb-1 text-neon-red hover:opacity-70 px-2 cursor-pointer"
                            aria-label="移除此付款"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <GlassButton type="button" variant="secondary" size="sm" onClick={addRow}>
                    + 新增付款項目
                  </GlassButton>

                  {totalPaid > 0 && (
                    <p className="text-xs text-neon-teal text-right">
                      付款總計：<span className="font-mono font-bold">${totalPaid.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              </GlassCard>

              {/* Split members */}
              <GlassCard title="分攤成員"
                titleIcon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                }
              >
                <MemberAvatarPicker
                  members={members}
                  selected={splitMembers}
                  onToggle={toggleSplitMember}
                  label="選擇分攤成員"
                />
                {errors["splitMembers"] && (
                  <p className="text-xs text-neon-red mt-2">{errors["splitMembers"]}</p>
                )}
              </GlassCard>

              {/* Split mode */}
              <GlassCard title="分帳模式"
                titleIcon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                }
              >
                <div className="grid grid-cols-3 gap-2 mb-4 p-1 bg-white/5 rounded-xl" role="radiogroup" aria-label="分帳模式">
                  {(Object.keys(SPLIT_MODE_LABELS) as SplitMode[]).map((mode) => {
                    const m = SPLIT_MODE_LABELS[mode];
                    const isSelected = splitMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSplitMode(mode)}
                        className={`rounded-lg p-3 text-center transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "text-neon-teal bg-neon-teal/10 shadow-glow-teal"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <div className="font-mono text-xl mb-1">{m.icon}</div>
                        <div className="text-[9px] font-medium">{m.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* PERCENTAGE inputs */}
                {splitMode === "PERCENTAGE" && splitMembers.length > 0 && (
                  <div className="space-y-2">
                    {splitMembers.map((id) => {
                      const member = members.find((m) => m.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-24 truncate">
                            {member?.name ?? id.slice(0, 8)}
                          </span>
                          <GlassInput
                            label=""
                            type="number"
                            value={percentageMap[id] ?? ""}
                            onChange={(e) =>
                              setPercentageMap((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                            placeholder="%"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      );
                    })}
                    <p className="text-xs text-slate-500 text-right">
                      總計：<span className="font-mono">{splitMembers.reduce((s, id) => s + (parseFloat(percentageMap[id] ?? "0") || 0), 0)}%</span>
                    </p>
                  </div>
                )}

                {/* EXACT inputs */}
                {splitMode === "EXACT" && splitMembers.length > 0 && (
                  <div className="space-y-2">
                    {splitMembers.map((id) => {
                      const member = members.find((m) => m.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-24 truncate">
                            {member?.name ?? id.slice(0, 8)}
                          </span>
                          <GlassInput
                            label=""
                            type="number"
                            value={exactMap[id] ?? ""}
                            onChange={(e) =>
                              setExactMap((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      );
                    })}
                    <p className="text-xs text-slate-500 text-right">
                      總計：<span className="font-mono">${splitMembers.reduce((s, id) => s + (parseFloat(exactMap[id] ?? "0") || 0), 0).toFixed(2)}</span>
                    </p>
                  </div>
                )}
              </GlassCard>
            </>
          )}

          {apiError && (
            <div className="flex items-center gap-2 text-neon-red text-sm bg-neon-red/10 border border-neon-red/20 rounded-xl px-4 py-3" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {apiError}
            </div>
          )}

          <GlassButton type="submit" variant="primary" size="lg" fullWidth loading={mutation.isPending}>
            {isPersonal ? "記帳" : "確認記帳"}
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
