import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const mutation = useMutation({
    mutationFn: () => userApi.login({ email: email.trim(), password }),
    onSuccess: (res) => {
      login({ id: res.data.id, name: res.data.name, email: res.data.email, avatarUrl: res.data.avatarUrl, personalGroupId: res.data.personalGroupId, token: res.data.token, customCategories: res.data.customCategories });
      navigate("/dashboard");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setApiError("Email 或密碼錯誤");
        } else {
          setApiError(err.message);
        }
      }
    },
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors["email"] = "Email 不能為空";
    else if (!email.includes("@")) newErrors["email"] = "Email 格式不正確";
    if (!password) newErrors["password"] = "密碼不能為空";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    if (validate()) mutation.mutate();
  }

  return (
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-6xl mb-4 animate-float-pixel" aria-hidden="true">⚔</p>
          <h1 className="font-pixel text-pixel-lg text-pixel-gold text-shadow-pixel">
            SplitQuest
          </h1>
          <p className="font-vt text-vt-base text-pixel-muted mt-2">
            像素風格分帳冒險
          </p>
        </div>

        {/* Card */}
        <div className="border-2 border-pixel-gold shadow-pixel-gold bg-pixel-panel p-6">
          <h2 className="font-pixel text-pixel-sm text-pixel-gold mb-6 text-center">
            ▶ 開始冒險
          </h2>

          <form onSubmit={handleSubmit} noValidate aria-label="登入表單">
            <div className="flex flex-col gap-4">
              <PixelInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors["email"]}
                placeholder="hero@quest.com"
                autoComplete="email"
                required
              />
              <PixelInput
                label="密碼"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors["password"]}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

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
                ▶ 出發！
              </PixelButton>
            </div>
          </form>

          <p className="font-vt text-vt-sm text-pixel-muted text-center mt-4">
            新冒險者？{" "}
            <Link
              to="/register"
              className="text-pixel-cyan hover:text-pixel-gold transition-colors"
            >
              建立帳號 →
            </Link>
          </p>
        </div>

        {/* Blink cursor */}
        <p className="text-center font-pixel text-pixel-xs text-pixel-muted mt-6">
          PRESS START <span className="animate-blink">▮</span>
        </p>
      </div>
    </div>
  );
}
