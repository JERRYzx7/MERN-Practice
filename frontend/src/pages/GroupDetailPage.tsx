import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { groupApi } from "@/lib/api";
import { useLocalGroups } from "@/hooks/useLocalGroups";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelLoader, PixelEmpty } from "@/components/ui/PixelLoader";
import { InviteQRModal } from "@/components/InviteQRModal";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId, personalGroupId } = useAuthStore();
  const { groups } = useLocalGroups();
  const group = groups.find((g) => g.id === groupId);
  const isTeamGroup = groupId !== personalGroupId;

  const [showInviteModal, setShowInviteModal] = useState(false);

  // 取得群組成員
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => groupApi.getMembers(groupId!),
    enabled: !!groupId && isTeamGroup,
  });

  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["balance", groupId],
    queryFn: () => groupApi.getBalance(groupId!),
    enabled: !!groupId,
  });

  const members = membersData?.data ?? [];
  const settlements = balanceData?.data.settlements ?? [];
  const myBalance = balanceData?.data.netBalances[userId!] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header - 合併返回按鈕和群組名稱 */}
      <div className="flex items-center">
        <Link
          to="/groups"
          className="font-pixel text-pixel-sm text-pixel-gold hover:text-pixel-light transition-colors flex items-center gap-2"
          aria-label={`返回群組列表，目前在 ${group?.name ?? "群組"}`}
        >
          <span className="text-pixel-muted">◀</span>
          {group?.name ?? "載入中..."}
        </Link>
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

      {/* Members Card (Team groups only) */}
      {isTeamGroup && (
        <PixelCard title={`成員 (${members.length})`} titleIcon="👥">
          {isLoadingMembers ? (
            <PixelLoader text="載入中" />
          ) : members.length === 0 ? (
            <p className="font-vt text-vt-sm text-pixel-muted text-center py-2">
              尚無成員資料
            </p>
          ) : (
            <ul className="space-y-2" role="list">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 py-2 border-b border-pixel-border last:border-0"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-none border-2 border-pixel-border overflow-hidden bg-pixel-dark flex-shrink-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-pixel text-pixel-xs text-pixel-muted">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <span className="font-vt text-vt-base text-pixel-light flex-1">
                    {member.name}
                    {member.id === userId && (
                      <span className="text-pixel-gold ml-2">(你)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Invite Button inside Members card */}
          <div className="mt-4 pt-3 border-t border-pixel-border">
            <PixelButton
              variant="secondary"
              fullWidth
              onClick={() => setShowInviteModal(true)}
            >
              📨 邀請好友加入
            </PixelButton>
          </div>
        </PixelCard>
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
    </div>
  );
}
