import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { groupApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelLoader } from "@/components/ui/PixelLoader";

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

  // 未登入：顯示登入提示
  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <PixelCard variant="gold" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="text-6xl">🔐</div>
            <h1 className="font-pixel text-pixel-lg text-pixel-gold">
              需要登入
            </h1>
            <p className="font-vt text-vt-lg text-pixel-text">
              請先登入或註冊帳號，即可加入群組
            </p>
            <div className="space-y-3">
              <Link to={`/login?redirect=/join/${inviteCode}`}>
                <PixelButton className="w-full">🎮 登入</PixelButton>
              </Link>
              <Link to={`/register?redirect=/join/${inviteCode}`}>
                <PixelButton variant="secondary" className="w-full">
                  ✨ 註冊新帳號
                </PixelButton>
              </Link>
            </div>
          </div>
        </PixelCard>
      </div>
    );
  }

  // 確認加入畫面
  if (status === "confirm") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <PixelCard variant="gold" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="text-6xl">📨</div>
            <h1 className="font-pixel text-pixel-lg text-pixel-gold">
              群組邀請
            </h1>
            <p className="font-vt text-vt-lg text-pixel-text">
              你收到了一個群組邀請！
              <br />
              是否要加入這個群組？
            </p>
            <div className="space-y-3">
              <PixelButton onClick={handleJoin} className="w-full">
                ✅ 確認加入
              </PixelButton>
              <PixelButton
                variant="secondary"
                onClick={handleCancel}
                className="w-full"
              >
                ❌ 取消
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    );
  }

  // 正在加入
  if (status === "joining") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <PixelCard variant="default" className="max-w-md w-full text-center">
          <div className="py-8 space-y-4">
            <PixelLoader />
            <p className="font-vt text-vt-lg text-pixel-text">正在加入群組...</p>
          </div>
        </PixelCard>
      </div>
    );
  }

  // 加入成功
  if (status === "success" && joinedGroupId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <PixelCard variant="green" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="text-6xl animate-pixel-bounce">🎉</div>
            <h1 className="font-pixel text-pixel-lg text-pixel-green">
              加入成功！
            </h1>
            <p className="font-vt text-vt-lg text-pixel-text">
              歡迎加入群組！開始一起分帳吧～
            </p>
            <div className="space-y-3">
              <PixelButton
                onClick={() => navigate(`/groups/${joinedGroupId}`)}
                className="w-full"
              >
                📊 查看群組
              </PixelButton>
              <PixelButton
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                🏠 回到首頁
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    );
  }

  // 已經是成員
  if (status === "already_member") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <PixelCard variant="gold" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="text-6xl">👋</div>
            <h1 className="font-pixel text-pixel-lg text-pixel-gold">
              你已經是成員
            </h1>
            <p className="font-vt text-vt-lg text-pixel-text">
              你已經加入過這個群組了！
            </p>
            <div className="space-y-3">
              <PixelButton
                onClick={() => navigate("/groups")}
                className="w-full"
              >
                📋 查看我的群組
              </PixelButton>
              <PixelButton
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                🏠 回到首頁
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    );
  }

  // 錯誤
  if (status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <PixelCard variant="red" className="max-w-md w-full text-center">
          <div className="py-6 space-y-6">
            <div className="text-6xl">❌</div>
            <h1 className="font-pixel text-pixel-lg text-pixel-red">
              加入失敗
            </h1>
            <p className="font-vt text-vt-lg text-pixel-text">
              {errorMessage || "邀請連結無效或已過期"}
            </p>
            <div className="space-y-3">
              <PixelButton
                onClick={() => setStatus("confirm")}
                className="w-full"
              >
                🔄 重試
              </PixelButton>
              <PixelButton
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                🏠 回到首頁
              </PixelButton>
            </div>
          </div>
        </PixelCard>
      </div>
    );
  }

  // 預設：載入中
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <PixelLoader />
    </div>
  );
}
