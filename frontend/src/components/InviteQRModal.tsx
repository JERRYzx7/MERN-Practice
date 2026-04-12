import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { groupApi } from "@/lib/api";
import { GlassButton } from "./ui/GlassButton";

interface InviteQRModalProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteQRModal({
  groupId,
  groupName,
  isOpen,
  onClose,
}: InviteQRModalProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInviteMutation = useMutation({
    mutationFn: () => groupApi.createInvite(groupId),
    onSuccess: (res) => {
      setInviteCode(res.data.inviteCode);
    },
  });

  const inviteUrl = inviteCode
    ? `${window.location.origin}/join/${inviteCode}`
    : null;

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateInvite = () => {
    createInviteMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div
        className="glass-card w-full max-w-sm mx-4 p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
          <h2
            id="invite-modal-title"
            className="font-pixel text-[10px] text-neon-teal uppercase tracking-widest"
          >
            邀請好友
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-neon-red transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            aria-label="關閉"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-slate-300 text-center">
            邀請好友加入 <span className="text-neon-teal font-semibold">{groupName}</span>
          </p>

          {!inviteCode ? (
            <div className="text-center py-4">
              <GlassButton
                onClick={handleGenerateInvite}
                disabled={createInviteMutation.isPending}
                className="w-full"
              >
                {createInviteMutation.isPending ? "產生中..." : "產生邀請連結"}
              </GlassButton>
              {createInviteMutation.isError && (
                <p className="mt-2 text-neon-red text-xs">
                  產生失敗，請稍後再試
                </p>
              )}
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={inviteUrl!}
                  size={180}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0a0e1e"
                />
              </div>

              {/* Invite URL */}
              <div className="glass-surface p-3">
                <p className="text-[10px] text-slate-500 mb-1">邀請連結</p>
                <p className="text-xs text-neon-teal break-all font-mono">
                  {inviteUrl}
                </p>
              </div>

              {/* Copy Button */}
              <GlassButton
                onClick={handleCopy}
                variant={copied ? "success" : "primary"}
                className="w-full"
              >
                {copied ? "已複製!" : "複製連結"}
              </GlassButton>

              {/* Expiry Notice */}
              <p className="text-[10px] text-slate-500 text-center">
                此連結 7 天內有效
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
