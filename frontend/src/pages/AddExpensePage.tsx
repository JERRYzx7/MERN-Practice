import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { expenseApi, ApiError } from "@/lib/api";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";

type SplitMode = "EQUAL" | "PERCENTAGE" | "EXACT";

const SPLIT_MODE_LABELS: Record<SplitMode, { label: string; desc: string; icon: string }> = {
  EQUAL: { label: "等額平分", desc: "所有人平均分攤", icon: "⊟" },
  PERCENTAGE: { label: "百分比", desc: "自訂各人比例", icon: "%" },
  EXACT: { label: "指定金額", desc: "直接輸入每人金額", icon: "$" },
};

export default function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId } = useAuthStore();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [memberIds, setMemberIds] = useState(userId ?? "");
  const [percentageInput, setPercentageInput] = useState("");
  const [exactInput, setExactInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const amount = parseFloat(totalAmount);
      const base = {
        description: description.trim(),
        totalAmount: amount,
        payerId: userId!,
        groupId: groupId!,
      };

      if (splitMode === "EQUAL") {
        const ids = memberIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return expenseApi.create({ ...base, splitType: "EQUAL", memberIds: ids });
      }

      if (splitMode === "PERCENTAGE") {
        const pct: Record<string, number> = {};
        percentageInput.split(",").forEach((pair) => {
          const [id, val] = pair.split(":").map((s) => s.trim());
          if (id && val) pct[id] = parseFloat(val);
        });
        return expenseApi.create({ ...base, splitType: "PERCENTAGE", percentageMap: pct });
      }

      // EXACT
      const exact: Record<string, number> = {};
      exactInput.split(",").forEach((pair) => {
        const [id, val] = pair.split(":").map((s) => s.trim());
        if (id && val) exact[id] = parseFloat(val);
      });
      return expenseApi.create({ ...base, splitType: "EXACT", exactMap: exact });
    },
    onSuccess: () => {
      navigate(`/groups/${groupId}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) setApiError(err.message);
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!description.trim()) e["description"] = "請輸入描述";
    const amt = parseFloat(totalAmount);
    if (!totalAmount || isNaN(amt) || amt <= 0) e["totalAmount"] = "請輸入正確金額";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiError("");
    if (validate()) mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/groups/${groupId}`}
          className="font-pixel text-pixel-xs text-pixel-muted hover:text-pixel-gold transition-colors"
        >
          ◀ 返回
        </Link>
        <h1 className="font-pixel text-pixel-sm text-pixel-gold">＋ 新增支出</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="新增支出表單">
        <div className="space-y-4">
          {/* Basic info */}
          <PixelCard title="支出資訊" titleIcon="💰">
            <div className="space-y-4">
              <PixelInput
                label="描述"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={errors["description"]}
                placeholder="晚餐、機票..."
                required
              />
              <PixelInput
                label="金額"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                error={errors["totalAmount"]}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </PixelCard>

          {/* Split mode selector */}
          <PixelCard title="分帳模式" titleIcon="⚖">
            <fieldset>
              <legend className="sr-only">選擇分帳模式</legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="分帳模式">
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
                          ? "border-pixel-gold shadow-pixel-gold text-pixel-gold bg-pixel-gold/10 translate-x-[2px] translate-y-[2px]"
                          : "border-pixel-border text-pixel-muted hover:border-pixel-gold/50"
                      }`}
                    >
                      <div className="font-vt text-vt-xl mb-1" aria-hidden="true">
                        {m.icon}
                      </div>
                      <div className="font-pixel text-[8px] leading-tight">{m.label}</div>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-4">
              {splitMode === "EQUAL" && (
                <PixelInput
                  label="成員 ID（逗號分隔）"
                  type="text"
                  value={memberIds}
                  onChange={(e) => setMemberIds(e.target.value)}
                  hint={`例：${userId},member-id-2`}
                  placeholder="id1, id2, id3..."
                />
              )}
              {splitMode === "PERCENTAGE" && (
                <PixelInput
                  label="百分比（id:百分比，逗號分隔）"
                  type="text"
                  value={percentageInput}
                  onChange={(e) => setPercentageInput(e.target.value)}
                  hint={`例：${userId}:60,member-id:40`}
                  placeholder="id1:60, id2:40"
                />
              )}
              {splitMode === "EXACT" && (
                <PixelInput
                  label="金額（id:金額，逗號分隔）"
                  type="text"
                  value={exactInput}
                  onChange={(e) => setExactInput(e.target.value)}
                  hint={`例：${userId}:50,member-id:25`}
                  placeholder="id1:50, id2:25"
                />
              )}
            </div>
          </PixelCard>

          {apiError && (
            <p role="alert" className="font-vt text-vt-sm text-pixel-red border-2 border-pixel-red p-3">
              ✕ {apiError}
            </p>
          )}

          <PixelButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={mutation.isPending}
          >
            ▶ 確認記帳
          </PixelButton>
        </div>
      </form>
    </div>
  );
}
