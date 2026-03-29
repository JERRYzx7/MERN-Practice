import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { groupApi } from "@/lib/api";
import { PixelButton } from "./ui/PixelButton";
import { PixelCard } from "./ui/PixelCard";

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
      // Fallback for older browsers
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <PixelCard
        variant="gold"
        className="w-full max-w-sm mx-4 animate-float-pixel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-2 border-pixel-gold pb-3 mb-4 flex items-center justify-between">
          <h2
            id="invite-modal-title"
            className="font-pixel text-pixel-sm text-pixel-gold uppercase tracking-wider"
          >
            📨 邀請好友
          </h2>
          <button
            onClick={onClose}
            className="text-pixel-muted hover:text-pixel-red transition-colors font-vt text-vt-lg"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="font-vt text-vt-base text-pixel-text text-center">
            邀請好友加入 <span className="text-pixel-gold">{groupName}</span>
          </p>

          {!inviteCode ? (
            <div className="text-center py-4">
              <PixelButton
                onClick={handleGenerateInvite}
                disabled={createInviteMutation.isPending}
                className="w-full"
              >
                {createInviteMutation.isPending ? "產生中..." : "🎫 產生邀請連結"}
              </PixelButton>
              {createInviteMutation.isError && (
                <p className="mt-2 text-pixel-red font-vt text-vt-sm">
                  產生失敗，請稍後再試
                </p>
              )}
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white">
                <QRCodeSVG
                  value={inviteUrl!}
                  size={180}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0a0e1a"
                />
              </div>

              {/* Invite URL */}
              <div className="bg-pixel-bg border-2 border-pixel-border p-3">
                <p className="font-vt text-vt-sm text-pixel-muted mb-1">邀請連結</p>
                <p className="font-vt text-vt-sm text-pixel-cyan break-all">
                  {inviteUrl}
                </p>
              </div>

              {/* Copy Button */}
              <PixelButton
                onClick={handleCopy}
                variant={copied ? "success" : "primary"}
                className="w-full"
              >
                {copied ? "✅ 已複製!" : "📋 複製連結"}
              </PixelButton>

              {/* Expiry Notice */}
              <p className="font-vt text-vt-sm text-pixel-muted text-center">
                ⏰ 此連結 7 天內有效
              </p>
            </>
          )}
        </div>
      </PixelCard>
    </div>
  );
}
