import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { expenseApi, ApiError, type PaymentRecord } from "@/lib/api";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { MemberAvatarPicker } from "@/components/ui/MemberAvatarPicker";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";

type SplitMode = "EQUAL" | "PERCENTAGE" | "EXACT";

const SPLIT_MODE_LABELS: Record<SplitMode, { label: string; icon: string }> = {
  EQUAL: { label: "等額平分", icon: "⊟" },
  PERCENTAGE: { label: "百分比", icon: "%" },
  EXACT: { label: "指定金額", icon: "$" },
};

// ── Category presets ──────────────────────────────────────
const PRESET_CATEGORIES = [
  { key: "food",      label: "餐飲",  icon: "🍽" },
  { key: "transport", label: "交通",  icon: "🚗" },
  { key: "housing",   label: "住房",  icon: "🏠" },
  { key: "shopping",  label: "購物",  icon: "🛒" },
  { key: "entertainment", label: "娛樂", icon: "🎮" },
  { key: "health",    label: "醫療",  icon: "💊" },
  { key: "education", label: "教育",  icon: "📚" },
  { key: "travel",    label: "旅遊",  icon: "✈️" },
  { key: "tech",      label: "3C",    icon: "💻" },
  { key: "gift",      label: "禮物",  icon: "🎁" },
  { key: "work",      label: "工作",  icon: "💼" },
  { key: "sports",    label: "運動",  icon: "🏋️" },
];
const MAX_CUSTOM = 87; // 99 - 12 presets
const CUSTOM_STORAGE_KEY = "splitquest-custom-categories";

function loadCustomCategories(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) ?? "[]");
  } catch { return []; }
}
function saveCustomCategory(name: string): void {
  const existing = loadCustomCategories();
  if (existing.includes(name) || existing.length >= MAX_CUSTOM) return;
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify([...existing, name]));
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface PaymentRow {
  userId: string;
  amount: string;
  note: string;
}

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId, personalGroupId } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isPersonal = groupId === personalGroupId;
  const { data: members = [] } = useGroupMembers(isPersonal ? undefined : groupId);

  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [category, setCategory] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>(loadCustomCategories);

  // Personal: single amount field
  const [personalAmount, setPersonalAmount] = useState("");

  // Group: payment rows (who paid how much)
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([
    { userId: userId ?? "", amount: "", note: "" },
  ]);

  // Group: who participates in the split
  const [splitMembers, setSplitMembers] = useState<string[]>([userId ?? ""]);
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");

  // PERCENTAGE / EXACT raw maps (userId → value string)
  const [percentageMap, setPercentageMap] = useState<Record<string, string>>({});
  const [exactMap, setExactMap] = useState<Record<string, string>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  // ── helpers ──────────────────────────────────────────────

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

  // ── validation ───────────────────────────────────────────

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

  // ── mutation ─────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        description: description.trim(),
        groupId: groupId!,
        date: expenseDate,
        category: category || undefined,
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

      // EXACT
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

  // ── render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={backTo} className="font-pixel text-pixel-xs text-pixel-muted hover:text-pixel-gold transition-colors">
          ◀ 返回
        </Link>
        <h1 className="font-pixel text-pixel-sm text-pixel-gold">
          {isPersonal ? "📒 記帳" : "＋ 新增支出"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="新增支出表單">
        <div className="space-y-4">

          {/* Description */}
          <PixelCard title="支出資訊" titleIcon="💰">
            <PixelInput
              label="描述"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors["description"]}
              placeholder={isPersonal ? "咖啡、午餐、交通..." : "晚餐、機票、住宿..."}
              required
              autoFocus
            />
          </PixelCard>

          {/* Date */}
          <PixelCard title="日期" titleIcon="📅">
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="bg-pixel-card border-2 border-pixel-border px-4 py-3 font-vt text-vt-base text-pixel-text w-full focus:outline-none focus-visible:border-pixel-gold"
            />
          </PixelCard>

          {/* Category */}
          <PixelCard title="分類" titleIcon="🏷">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
              {/* None */}
              <button
                type="button"
                onClick={() => setCategory("")}
                className={`flex flex-col items-center gap-1 border-2 p-2 transition-all ${
                  category === ""
                    ? "border-pixel-gold text-pixel-gold bg-pixel-gold/10"
                    : "border-pixel-border text-pixel-muted hover:border-pixel-gold/50"
                }`}
              >
                <span className="text-lg">—</span>
                <span className="font-pixel text-[7px]">未分類</span>
              </button>

              {PRESET_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.label)}
                  className={`flex flex-col items-center gap-1 border-2 p-2 transition-all ${
                    category === c.label
                      ? "border-pixel-gold text-pixel-gold bg-pixel-gold/10"
                      : "border-pixel-border text-pixel-muted hover:border-pixel-gold/50"
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="font-pixel text-[7px]">{c.label}</span>
                </button>
              ))}

              {customCategories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`flex flex-col items-center gap-1 border-2 p-2 transition-all ${
                    category === name
                      ? "border-pixel-gold text-pixel-gold bg-pixel-gold/10"
                      : "border-pixel-border text-pixel-muted hover:border-pixel-gold/50"
                  }`}
                >
                  <span className="text-lg">🏷</span>
                  <span className="font-pixel text-[7px] truncate w-full text-center">{name}</span>
                </button>
              ))}
            </div>

            {/* Custom category input */}
            {customCategories.length < MAX_CUSTOM && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="自訂分類名稱"
                  maxLength={20}
                  className="flex-1 bg-pixel-card border-2 border-pixel-border px-3 py-2 font-vt text-vt-sm text-pixel-text focus:outline-none focus-visible:border-pixel-gold placeholder:text-pixel-muted"
                />
                <button
                  type="button"
                  disabled={!customInput.trim()}
                  onClick={() => {
                    const name = customInput.trim();
                    if (!name) return;
                    saveCustomCategory(name);
                    setCustomCategories(loadCustomCategories());
                    setCategory(name);
                    setCustomInput("");
                  }}
                  className="border-2 border-pixel-border px-3 py-2 font-pixel text-pixel-xs text-pixel-muted hover:border-pixel-gold hover:text-pixel-gold disabled:opacity-40 transition-colors"
                >
                  ＋ 儲存
                </button>
              </div>
            )}
          </PixelCard>

          {/* ── Personal: simple amount ── */}
          {isPersonal && (
            <PixelCard title="金額" titleIcon="💴">
              <PixelInput
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
            </PixelCard>
          )}

          {/* ── Group: payment rows ── */}
          {!isPersonal && (
            <>
              <PixelCard title="付款人" titleIcon="💳">
                <div className="space-y-3">
                  {paymentRows.map((row, idx) => (
                    <div key={idx} className="space-y-2 border border-pixel-border p-3">
                      {/* Payer picker */}
                      <MemberAvatarPicker
                        members={members}
                        selected={row.userId ? [row.userId] : []}
                        onToggle={(id) => updateRow(idx, "userId", row.userId === id ? "" : id)}
                        label={`付款人 ${idx + 1}`}
                      />
                      {errors[`pay-user-${idx}`] && (
                        <p className="font-vt text-vt-xs text-pixel-red">{errors[`pay-user-${idx}`]}</p>
                      )}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <PixelInput
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
                          <PixelInput
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
                            className="self-end mb-1 font-pixel text-pixel-xs text-pixel-red hover:opacity-70 px-2"
                            aria-label="移除此付款"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <PixelButton type="button" variant="secondary" size="sm" onClick={addRow}>
                    ＋ 新增付款項目
                  </PixelButton>

                  {totalPaid > 0 && (
                    <p className="font-pixel text-pixel-xs text-pixel-gold text-right">
                      付款總計：${totalPaid.toFixed(2)}
                    </p>
                  )}
                </div>
              </PixelCard>

              {/* Split members */}
              <PixelCard title="分攤成員" titleIcon="👥">
                <MemberAvatarPicker
                  members={members}
                  selected={splitMembers}
                  onToggle={toggleSplitMember}
                  label="選擇分攤成員"
                />
                {errors["splitMembers"] && (
                  <p className="font-vt text-vt-xs text-pixel-red mt-2">{errors["splitMembers"]}</p>
                )}
              </PixelCard>

              {/* Split mode */}
              <PixelCard title="分帳模式" titleIcon="⚖">
                <div className="grid grid-cols-3 gap-2 mb-4" role="radiogroup" aria-label="分帳模式">
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
                        className={`border-2 p-3 text-center transition-all duration-75 ${
                          isSelected
                            ? "border-pixel-gold text-pixel-gold bg-pixel-gold/10"
                            : "border-pixel-border text-pixel-muted hover:border-pixel-gold/50"
                        }`}
                      >
                        <div className="font-vt text-vt-xl mb-1">{m.icon}</div>
                        <div className="font-pixel text-[8px]">{m.label}</div>
                      </button>
                    );
                  })}
                </div>

                {/* PERCENTAGE: per-member % input */}
                {splitMode === "PERCENTAGE" && splitMembers.length > 0 && (
                  <div className="space-y-2">
                    {splitMembers.map((id) => {
                      const member = members.find((m) => m.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="font-pixel text-pixel-xs text-pixel-muted w-24 truncate">
                            {member?.name ?? id.slice(0, 8)}
                          </span>
                          <PixelInput
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
                          <span className="font-vt text-vt-sm text-pixel-muted">%</span>
                        </div>
                      );
                    })}
                    <p className="font-pixel text-pixel-xs text-pixel-muted text-right">
                      總計：{splitMembers.reduce((s, id) => s + (parseFloat(percentageMap[id] ?? "0") || 0), 0)}%
                    </p>
                  </div>
                )}

                {/* EXACT: per-member amount input */}
                {splitMode === "EXACT" && splitMembers.length > 0 && (
                  <div className="space-y-2">
                    {splitMembers.map((id) => {
                      const member = members.find((m) => m.id === id);
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="font-pixel text-pixel-xs text-pixel-muted w-24 truncate">
                            {member?.name ?? id.slice(0, 8)}
                          </span>
                          <PixelInput
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
                    <p className="font-pixel text-pixel-xs text-pixel-muted text-right">
                      總計：${splitMembers.reduce((s, id) => s + (parseFloat(exactMap[id] ?? "0") || 0), 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </PixelCard>
            </>
          )}

          {apiError && (
            <p role="alert" className="font-vt text-vt-sm text-pixel-red border-2 border-pixel-red p-3">
              ✕ {apiError}
            </p>
          )}

          <PixelButton type="submit" variant="primary" size="lg" fullWidth loading={mutation.isPending}>
            {isPersonal ? "▶ 記帳" : "▶ 確認記帳"}
          </PixelButton>
        </div>
      </form>
    </div>
  );
}