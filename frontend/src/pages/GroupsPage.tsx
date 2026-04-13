import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { groupApi, ApiError } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassEmpty, GlassLoader } from "@/components/ui/GlassLoader";
import { GlassBadge } from "@/components/ui/GlassBadge";

export default function GroupsPage() {
  const { userId } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupApi.getGroups(),
    enabled: !!userId,
  });

  const teamGroups = (data?.data ?? []).filter((g) => g.type === "Team");

  const mutation = useMutation({
    mutationFn: () =>
      groupApi.create({
        name: groupName.trim(),
        ownerId: userId!,
        memberIds: [userId!],
      }),
    onSuccess: () => {
      setGroupName("");
      setShowForm(false);
      void qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.message);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => groupApi.joinByInvite(code),
    onSuccess: (res) => {
      setInviteCode("");
      setJoinError("");
      void qc.invalidateQueries({ queryKey: ["groups"] });
      navigate(`/groups/${res.data.groupId}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setJoinError(err.message);
      } else {
        setJoinError("加入群組失敗，請稍後再試");
      }
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!groupName.trim()) {
      setError("群組名稱不能為空");
      return;
    }
    mutation.mutate();
  }

  function handleJoinByCode(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    const code = inviteCode.trim();
    if (!code) {
      setJoinError("請輸入小組代碼");
      return;
    }
    joinMutation.mutate(code);
  }

  if (isLoading) return <GlassLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-[11px] text-neon-teal tracking-wider">我的群組</h1>
        <GlassButton
          variant={showForm ? "ghost" : "primary"}
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          aria-controls="create-group-form"
        >
          {showForm ? "取消" : "+ 新群組"}
        </GlassButton>
      </div>

      {/* Create group form */}
      {showForm && (
        <GlassCard id="create-group-form" title="建立新群組" variant="teal"
          titleIcon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="23" y1="11" x2="17" y2="11" />
              <line x1="20" y1="8" x2="20" y2="14" />
            </svg>
          }
        >
          <form onSubmit={handleCreate} aria-label="建立群組表單">
            <div className="flex flex-col gap-4">
              <GlassInput
                label="群組名稱"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                error={error}
                placeholder="旅遊、聚餐..."
                autoFocus
                required
              />
              <GlassButton
                type="submit"
                variant="primary"
                fullWidth
                loading={mutation.isPending}
              >
                建立
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard
        title="透過小組代碼加入"
        variant="teal"
        titleIcon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        }
      >
        <form onSubmit={handleJoinByCode} aria-label="小組代碼加入表單" className="space-y-3">
          <GlassInput
            label="小組代碼"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            error={joinError}
            placeholder="貼上邀請代碼"
            required
          />
          <GlassButton type="submit" variant="secondary" fullWidth loading={joinMutation.isPending}>
            加入群組
          </GlassButton>
        </form>
      </GlassCard>

      {/* Groups list */}
      {teamGroups.length === 0 ? (
        <GlassEmpty
          icon={
            <svg className="w-10 h-10 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
          title="還沒有群組"
          description="建立一個群組開始分帳吧！"
        />
      ) : (
        <ul className="space-y-3" role="list">
          {teamGroups.map((group) => (
            <li key={group.id}>
              <Link
                to={`/groups/${group.id}`}
                className="block glass-card p-4 hover:border-neon-teal/20 hover:shadow-glow-teal transition-all duration-300 cursor-pointer group"
                aria-label={`群組：${group.name}，${group.memberIds.length} 名成員`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200 mb-2 group-hover:text-neon-teal transition-colors">
                      {group.name}
                    </h2>
                    <GlassBadge variant="muted">
                      {group.memberIds.length} 人
                    </GlassBadge>
                  </div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-neon-teal transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
