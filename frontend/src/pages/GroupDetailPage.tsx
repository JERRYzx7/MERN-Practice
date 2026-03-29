import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { groupApi, ApiError } from "@/lib/api";
import { useLocalGroups } from "@/hooks/useLocalGroups";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelLoader, PixelEmpty } from "@/components/ui/PixelLoader";
import { InviteQRModal } from "@/components/InviteQRModal";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId, personalGroupId } = useAuthStore();
  const { groups } = useLocalGroups();
  const group = groups.find((g) => g.id === groupId);
  const isTeamGroup = groupId !== personalGroupId;

  const [newMemberId, setNewMemberId] = useState("");
  const [memberError, setMemberError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["balance", groupId],
    queryFn: () => groupApi.getBalance(groupId!),
    enabled: !!groupId,
  });

  const addMemberMutation = useMutation({
    mutationFn: () => groupApi.addMember(groupId!, newMemberId.trim()),
    onSuccess: () => {
      setNewMemberId("");
      setMemberError("");
    },
    onError: (err) => {
      if (err instanceof ApiError) setMemberError(err.message);
    },
  });

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberId.trim()) {
      setMemberError("請輸入成員 ID");
      return;
    }
    addMemberMutation.mutate();
  }

  const settlements = balanceData?.data.settlements ?? [];
  const myBalance = balanceData?.data.netBalances[userId!] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/groups"
          className="font-pixel text-pixel-xs text-pixel-muted hover:text-pixel-gold transition-colors"
          aria-label="返回群組列表"
        >
          ◀ 返回
        </Link>
        <h1 className="font-pixel text-pixel-sm text-pixel-gold">
          {group?.name ?? groupId}
        </h1>
      </div>

      {/* My balance in this group */}
      <PixelCard title="我的結餘" titleIcon="⚖" variant="gold">
        {isLoadingBalance ? (
          <PixelLoader text="計算中" />
        ) : (
          <div className="text-center py-2">
            <p
              className={`font-vt text-vt-2xl font-bold ${myBalance >= 0 ? "text-pixel-green" : "text-pixel-red"}`}
              aria-label={`我的結餘 ${myBalance >= 0 ? "正" : "負"} ${Math.abs(myBalance).toFixed(2)} 元`}
            >
              {myBalance >= 0 ? "+" : ""}${myBalance.toFixed(2)}
            </p>
            <p className="font-vt text-vt-sm text-pixel-muted mt-1">
              {myBalance > 0
                ? "別人欠你的"
                : myBalance < 0
                  ? "你需要還錢"
                  : "帳目平衡 ✓"}
            </p>
          </div>
        )}
      </PixelCard>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to={`/groups/${groupId}/expense/new`}>
          <PixelButton variant="primary" fullWidth>
            ＋ 新增支出
          </PixelButton>
        </Link>
        <Link to={`/groups/${groupId}/balance`}>
          <PixelButton variant="secondary" fullWidth>
            ⚖ 查看結算
          </PixelButton>
        </Link>
      </div>

      {/* Invite Button (Team groups only) */}
      {isTeamGroup && (
        <PixelButton
          variant="secondary"
          fullWidth
          onClick={() => setShowInviteModal(true)}
        >
          📨 邀請好友加入
        </PixelButton>
      )}

      {/* Invite QR Modal */}
      <InviteQRModal
        groupId={groupId!}
        groupName={group?.name ?? "群組"}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Settlements preview */}
      {settlements.length > 0 && (
        <PixelCard title="待結算項目" titleIcon="💰">
          <ul className="space-y-2" role="list">
            {settlements.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2 border-b border-pixel-border last:border-0"
              >
                <span className="font-vt text-vt-base">
                  <span className="text-pixel-red">{s.from.slice(0, 8)}</span>
                  <span className="text-pixel-muted mx-2">→</span>
                  <span className="text-pixel-green">{s.to.slice(0, 8)}</span>
                </span>
                <span className="font-vt text-vt-lg text-pixel-gold">
                  ${s.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </PixelCard>
      )}

      {!isLoadingBalance && settlements.length === 0 && (
        <PixelEmpty icon="✨" title="帳目清晰！" />
      )}

      {/* Add member */}
      <PixelCard title="加入成員" titleIcon="⊕" variant="dark">
        <form onSubmit={handleAddMember} aria-label="加入成員表單">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <PixelInput
                label="成員 ID"
                type="text"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                error={memberError}
                placeholder="輸入成員 ID..."
              />
            </div>
            <div className="pb-[1px]">
              <PixelButton
                type="submit"
                variant="secondary"
                loading={addMemberMutation.isPending}
              >
                加入
              </PixelButton>
            </div>
          </div>
        </form>
      </PixelCard>
    </div>
  );
}
