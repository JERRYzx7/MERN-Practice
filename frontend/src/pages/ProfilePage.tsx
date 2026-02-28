import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { userApi, ApiError } from "@/lib/api";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";

// ── Preset avatars (inline SVG data URIs) ────────────────
const AVATAR_PRESETS = [
  { key: "knight",   bg: "#4a3f6b", icon: "⚔" },
  { key: "mage",     bg: "#2d4a6b", icon: "🔮" },
  { key: "archer",   bg: "#3b5e3b", icon: "🏹" },
  { key: "rogue",    bg: "#5e3b3b", icon: "🗡" },
  { key: "healer",   bg: "#4a6b4a", icon: "✨" },
  { key: "berserker",bg: "#6b3b2d", icon: "🪓" },
  { key: "wizard",   bg: "#2d3b6b", icon: "🌟" },
  { key: "paladin",  bg: "#6b5a2d", icon: "🛡" },
] as const;

function makeAvatarDataUri(bg: string, icon: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/><text x="32" y="42" text-anchor="middle" font-size="28">${icon}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

const PRESET_URIS = AVATAR_PRESETS.map((p) => ({
  ...p,
  uri: makeAvatarDataUri(p.bg, p.icon),
}));

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return `hsl(${Math.abs(h) % 360}, 55%, 45%)`;
}

export default function ProfilePage() {
  const { userId, userName, userEmail, avatarUrl, updateUserInfo } = useAuthStore();

  const [name, setName] = useState(userName ?? "");
  // null = keep initials, string = selected preset URI
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(avatarUrl ?? null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const mutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (res) => {
      updateUserInfo({ name: res.data.name, avatarUrl: res.data.avatarUrl });
      setSuccessMsg("✔ 更新成功！");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "更新失敗";
      setErrors({ api: msg });
    },
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "名稱至少 2 個字";
    if (newPassword) {
      if (!currentPassword) e.currentPassword = "請輸入目前密碼";
      if (newPassword.length < 8) e.newPassword = "新密碼至少 8 個字";
      if (newPassword !== confirmPassword) e.confirmPassword = "新密碼不一致";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    if (!validate()) return;

    mutation.mutate({
      name: name !== userName ? name : undefined,
      avatarUrl: selectedAvatar !== (avatarUrl ?? null) ? selectedAvatar : undefined,
      ...(newPassword ? { currentPassword, newPassword } : {}),
    });
  }

  const initials = (userName ?? "?")[0].toUpperCase();
  const bgColor = hashColor(userId ?? "x");

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-pixel text-pixel-base text-pixel-gold mb-6">⚙ 個人資料</h1>

      <PixelCard className="p-6 space-y-6">
        {/* Current avatar preview */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-pixel-border overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: selectedAvatar ? undefined : bgColor }}
          >
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="頭貼" className="w-full h-full object-cover" />
            ) : (
              <span className="font-pixel text-white text-xl">{initials}</span>
            )}
          </div>
          <div>
            <p className="font-pixel text-pixel-xs text-pixel-gold">{userName}</p>
            <p className="font-vt text-vt-sm text-pixel-muted">{userEmail}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">顯示名稱</label>
            <PixelInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名稱"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Avatar preset picker */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-2">選擇頭貼</label>
            <div className="grid grid-cols-5 gap-2">
              {/* None / initials option */}
              <button
                type="button"
                onClick={() => setSelectedAvatar(null)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedAvatar === null
                    ? "border-pixel-gold scale-110 shadow-[0_0_8px_rgba(255,200,50,0.6)]"
                    : "border-pixel-border hover:border-pixel-muted"
                }`}
                style={{ backgroundColor: bgColor }}
                title="預設（名字首字母）"
              >
                <span className="font-pixel text-white text-sm">{initials}</span>
              </button>

              {PRESET_URIS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedAvatar(p.uri)}
                  className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${
                    selectedAvatar === p.uri
                      ? "border-pixel-gold scale-110 shadow-[0_0_8px_rgba(255,200,50,0.6)]"
                      : "border-pixel-border hover:border-pixel-muted"
                  }`}
                  title={p.key}
                >
                  <img src={p.uri} alt={p.key} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <hr className="border-pixel-border" />
          <p className="font-pixel text-pixel-xs text-pixel-muted">修改密碼（不修改請留空）</p>

          {/* Current password */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">目前密碼</label>
            <PixelInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="目前的密碼"
            />
            {errors.currentPassword && <p className="text-red-400 text-xs mt-1">{errors.currentPassword}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">新密碼</label>
            <PixelInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 8 個字"
            />
            {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">確認新密碼</label>
            <PixelInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再輸入一次新密碼"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.api && (
            <p className="text-red-400 font-pixel text-pixel-xs">{errors.api}</p>
          )}
          {successMsg && (
            <p className="text-green-400 font-pixel text-pixel-xs">{successMsg}</p>
          )}

          <PixelButton type="submit" variant="primary" fullWidth loading={mutation.isPending}>
            ▶ 儲存變更
          </PixelButton>
        </form>
      </PixelCard>
    </div>
  );
}


export default function ProfilePage() {
  const { userId, userName, userEmail, avatarUrl, updateUserInfo } = useAuthStore();

  const [name, setName] = useState(userName ?? "");
  const [avatarUrlInput, setAvatarUrlInput] = useState(avatarUrl ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const mutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (res) => {
      updateUserInfo({ name: res.data.name, avatarUrl: res.data.avatarUrl });
      setSuccessMsg("✔ 更新成功！");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "更新失敗";
      setErrors({ api: msg });
    },
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "名稱至少 2 個字";
    if (avatarUrlInput && !/^https?:\/\/.+/.test(avatarUrlInput)) e.avatarUrl = "請輸入有效的圖片網址";
    if (newPassword) {
      if (!currentPassword) e.currentPassword = "請輸入目前密碼";
      if (newPassword.length < 8) e.newPassword = "新密碼至少 8 個字";
      if (newPassword !== confirmPassword) e.confirmPassword = "新密碼不一致";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    if (!validate()) return;

    mutation.mutate({
      name: name !== userName ? name : undefined,
      avatarUrl: avatarUrlInput !== (avatarUrl ?? "") ? (avatarUrlInput || null) : undefined,
      ...(newPassword ? { currentPassword, newPassword } : {}),
    });
  }

  const displayAvatar = avatarUrlInput || avatarUrl;
  const initials = (userName ?? "?")[0].toUpperCase();
  const bgColor = hashColor(userId ?? "x");

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-pixel text-pixel-base text-pixel-gold mb-6">⚙ 個人資料</h1>

      <PixelCard className="p-6 space-y-6">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full border-2 border-pixel-border overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: displayAvatar ? undefined : bgColor }}
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt="頭貼" className="w-full h-full object-cover" />
            ) : (
              <span className="font-pixel text-white text-xl">{initials}</span>
            )}
          </div>
          <div>
            <p className="font-pixel text-pixel-xs text-pixel-gold">{userName}</p>
            <p className="font-vt text-vt-sm text-pixel-muted">{userEmail}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">顯示名稱</label>
            <PixelInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名稱"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">頭貼網址（選填）</label>
            <PixelInput
              value={avatarUrlInput}
              onChange={(e) => setAvatarUrlInput(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
            {errors.avatarUrl && <p className="text-red-400 text-xs mt-1">{errors.avatarUrl}</p>}
          </div>

          <hr className="border-pixel-border" />
          <p className="font-pixel text-pixel-xs text-pixel-muted">修改密碼（不修改請留空）</p>

          {/* Current password */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">目前密碼</label>
            <PixelInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="目前的密碼"
            />
            {errors.currentPassword && <p className="text-red-400 text-xs mt-1">{errors.currentPassword}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">新密碼</label>
            <PixelInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 8 個字"
            />
            {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block font-pixel text-pixel-xs text-pixel-text mb-1">確認新密碼</label>
            <PixelInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再輸入一次新密碼"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.api && (
            <p className="text-red-400 font-pixel text-pixel-xs">{errors.api}</p>
          )}
          {successMsg && (
            <p className="text-green-400 font-pixel text-pixel-xs">{successMsg}</p>
          )}

          <PixelButton type="submit" variant="primary" fullWidth loading={mutation.isPending}>
            ▶ 儲存變更
          </PixelButton>
        </form>
      </PixelCard>
    </div>
  );
}
