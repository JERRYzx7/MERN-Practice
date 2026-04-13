import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { groupApi, ApiError } from "@/lib/api";
import { useLocalGroups } from "@/hooks/useLocalGroups";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassLoader, GlassEmpty } from "@/components/ui/GlassLoader";
import { InviteQRModal } from "@/components/InviteQRModal";
import { IsometricOffice } from "@/components/ui/IsometricOffice";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { userId, personalGroupId } = useAuthStore();
  const { groups } = useLocalGroups();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const group = groups.find((g) => g.id === groupId);
  const isTeamGroup = groupId !== personalGroupId;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberActionError, setMemberActionError] = useState("");

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupApi.getGroups(),
    enabled: !!userId,
  });

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
  const currentGroup = groupsData?.data.find((g) => g.id === groupId);
  const isOwner = currentGroup?.ownerId === userId;

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => groupApi.removeMember(groupId!, memberId),
    onSuccess: () => {
      setMemberActionError("");
      void qc.invalidateQueries({ queryKey: ["members", groupId] });
      void qc.invalidateQueries({ queryKey: ["groups"] });
      void qc.invalidateQueries({ queryKey: ["balance", groupId] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setMemberActionError(err.message);
      } else {
        setMemberActionError("操作失敗，請稍後再試");
      }
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: () => groupApi.leaveGroup(groupId!),
    onSuccess: () => {
      setMemberActionError("");
      void qc.invalidateQueries({ queryKey: ["groups"] });
      navigate("/groups");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setMemberActionError(err.message);
      } else {
        setMemberActionError("離開群組失敗，請稍後再試");
      }
    },
  });

  function handleRemoveMember(memberId: string, memberName: string) {
    const ok = window.confirm(`確定要移除 ${memberName} 嗎？`);
    if (!ok) return;
    removeMemberMutation.mutate(memberId);
  }

  function handleLeaveGroup() {
    const ok = window.confirm("確定要離開這個群組嗎？");
    if (!ok) return;
    leaveGroupMutation.mutate();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/groups"
          className="text-slate-500 hover:text-neon-teal transition-colors p-1"
          aria-label={`返回群組列表，目前在 ${group?.name ?? "群組"}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="font-pixel text-[11px] text-neon-teal tracking-wider">
          {group?.name ?? "載入中..."}
        </h1>
      </div>

      {/* Isometric Office - Gather Town style */}
      {isTeamGroup && members.length > 0 && (
        <IsometricOffice
          members={members}
          currentUserId={userId}
          netBalances={balanceData?.data.netBalances ?? {}}
        />
      )}

      {/* My balance */}
      <GlassCard title="我的結餘" variant="teal"
        titleIcon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        }
      >
        {isLoadingBalance ? (
          <GlassLoader text="計算中" />
        ) : (
          <div className="text-center py-2">
            <p
              className={`font-mono text-3xl font-bold ${myBalance >= 0 ? "text-neon-green" : "text-neon-red"}`}
              aria-label={`我的結餘 ${myBalance >= 0 ? "正" : "負"} ${Math.abs(myBalance).toFixed(2)} 元`}
            >
              {myBalance >= 0 ? "+" : ""}${myBalance.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {myBalance > 0
                ? "別人欠你的"
                : myBalance < 0
                  ? "你需要還錢"
                  : "帳目平衡 ✓"}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to={`/groups/${groupId}/expense/new`}>
          <GlassButton variant="primary" fullWidth>
            + 新增支出
          </GlassButton>
        </Link>
        <Link to={`/groups/${groupId}/balance`}>
          <GlassButton variant="secondary" fullWidth>
            查看結算
          </GlassButton>
        </Link>
      </div>

      {/* Members Card */}
      {isTeamGroup && (
        <GlassCard title={`成員 (${members.length})`}
          titleIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        >
          {isLoadingMembers ? (
            <GlassLoader text="載入中" />
          ) : members.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">尚無成員資料</p>
          ) : (
            <ul className="space-y-2" role="list">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `hsl(${Math.abs([...member.id].reduce((h, c) => c.charCodeAt(0) + ((h << 5) - h), 0)) % 360}, 55%, 35%)` }}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm text-slate-300 flex-1">
                    {member.name}
                    {member.id === userId && (
                      <span className="text-neon-teal ml-1.5 text-xs">(你)</span>
                    )}
                  </span>
                  {isOwner && member.id !== userId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="text-xs text-neon-red hover:opacity-75 transition-opacity cursor-pointer"
                      disabled={removeMemberMutation.isPending || leaveGroupMutation.isPending}
                    >
                      移除
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
            <GlassButton
              variant="secondary"
              fullWidth
              onClick={() => setShowInviteModal(true)}
            >
              邀請好友加入
            </GlassButton>
            <GlassButton
              variant="ghost"
              fullWidth
              onClick={handleLeaveGroup}
              loading={leaveGroupMutation.isPending}
            >
              離開群組
            </GlassButton>
            {memberActionError && (
              <p className="text-xs text-neon-red text-center">{memberActionError}</p>
            )}
          </div>
        </GlassCard>
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
        <GlassCard title="待結算項目"
          titleIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        >
          <ul className="space-y-2" role="list">
            {settlements.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-sm">
                  <span className="text-neon-red">{s.from.slice(0, 8)}</span>
                  <span className="text-slate-600 mx-2">→</span>
                  <span className="text-neon-green">{s.to.slice(0, 8)}</span>
                </span>
                <span className="font-mono text-sm font-bold text-neon-amber">
                  ${s.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {!isLoadingBalance && settlements.length === 0 && (
        <GlassEmpty
          icon={<span className="text-3xl">✨</span>}
          title="帳目清晰！"
        />
      )}
    </div>
  );
}
