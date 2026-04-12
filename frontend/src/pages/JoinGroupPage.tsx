import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { groupApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassLoader } from "@/components/ui/GlassLoader";

type JoinStatus = "confirm" | "joining" | "success" | "error" | "already_member";

export default function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [status, setStatus] = useState<JoinStatus>("confirm");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

  const joinMutation = useMutation({
    mutationFn: (code: string) => groupApi.joinByInvite(code),
    onSuccess: (res) => {
      setStatus("success");
      setJoinedGroupId(res.data.groupId);
    },
    onError: (err: Error) => {
      const message = err.message || "加入失敗";
      if (message.includes("已經是群組成員")) {
        setStatus("already_member");
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    },
  });

  function handleJoin() {
    if (inviteCode) {
      setStatus("joining");
      joinMutation.mutate(inviteCode);
    }
  }

  function handleCancel() {
    navigate("/groups");
  }

  // 未登入
  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <GlassCard variant="teal" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neon-amber/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h1 className="font-pixel text-[12px] text-neon-teal tracking-wider">需要登入</h1>
            <p className="text-sm text-slate-300">請先登入或註冊帳號，即可加入群組</p>
            <div className="space-y-3">
              <Link to={`/login?redirect=/join/${inviteCode}`}>
                <GlassButton className="w-full">登入</GlassButton>
              </Link>
              <Link to={`/register?redirect=/join/${inviteCode}`}>
                <GlassButton variant="secondary" className="w-full">註冊新帳號</GlassButton>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 確認加入
  if (status === "confirm") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <GlassCard variant="teal" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neon-sky/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 className="font-pixel text-[12px] text-neon-teal tracking-wider">群組邀請</h1>
            <p className="text-sm text-slate-300">
              你收到了一個群組邀請！<br />是否要加入這個群組？
            </p>
            <div className="space-y-3">
              <GlassButton onClick={handleJoin} className="w-full">確認加入</GlassButton>
              <GlassButton variant="ghost" onClick={handleCancel} className="w-full">取消</GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 正在加入
  if (status === "joining") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full text-center">
          <div className="py-8 space-y-4">
            <GlassLoader />
            <p className="text-sm text-slate-300">正在加入群組...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 加入成功
  if (status === "success" && joinedGroupId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <GlassCard variant="green" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neon-green/15 flex items-center justify-center animate-float">
              <svg className="w-8 h-8 text-neon-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-pixel text-[12px] text-neon-green tracking-wider">加入成功！</h1>
            <p className="text-sm text-slate-300">歡迎加入群組！開始一起分帳吧～</p>
            <div className="space-y-3">
              <GlassButton onClick={() => navigate(`/groups/${joinedGroupId}`)} className="w-full">查看群組</GlassButton>
              <GlassButton variant="ghost" onClick={() => navigate("/dashboard")} className="w-full">回到首頁</GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 已經是成員
  if (status === "already_member") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <GlassCard variant="teal" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neon-amber/15 flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>
            <h1 className="font-pixel text-[12px] text-neon-amber tracking-wider">你已經是成員</h1>
            <p className="text-sm text-slate-300">你已經加入過這個群組了！</p>
            <div className="space-y-3">
              <GlassButton onClick={() => navigate("/groups")} className="w-full">查看我的群組</GlassButton>
              <GlassButton variant="ghost" onClick={() => navigate("/dashboard")} className="w-full">回到首頁</GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // 錯誤
  if (status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <GlassCard variant="red" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neon-red/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-neon-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="font-pixel text-[12px] text-neon-red tracking-wider">加入失敗</h1>
            <p className="text-sm text-slate-300">{errorMessage || "邀請連結無效或已過期"}</p>
            <div className="space-y-3">
              <GlassButton onClick={() => setStatus("confirm")} className="w-full">重試</GlassButton>
              <GlassButton variant="ghost" onClick={() => navigate("/dashboard")} className="w-full">回到首頁</GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <GlassLoader />
    </div>
  );
}
