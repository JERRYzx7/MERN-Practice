import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

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
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)" }} aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)" }} aria-hidden="true" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-teal to-emerald-600 shadow-glow-teal-lg mb-4 animate-float">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="font-pixel text-[13px] text-neon-teal text-glow-teal tracking-widest">
            SplitQuest
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            協作式智能分帳
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          <h2 className="font-pixel text-[10px] text-neon-teal mb-6 text-center uppercase tracking-widest">
            開始使用
          </h2>

          <form onSubmit={handleSubmit} noValidate aria-label="登入表單">
            <div className="flex flex-col gap-4">
              <GlassInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors["email"]}
                placeholder="hello@example.com"
                autoComplete="email"
                required
              />
              <GlassInput
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
                <div className="flex items-center gap-2 text-neon-red text-sm bg-neon-red/10 border border-neon-red/20 rounded-xl px-4 py-3" role="alert">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {apiError}
                </div>
              )}

              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={mutation.isPending}
              >
                登入
              </GlassButton>
            </div>
          </form>

          <p className="text-sm text-slate-500 text-center mt-5">
            還沒有帳號？{" "}
            <Link
              to="/register"
              className="text-neon-teal hover:text-neon-green transition-colors font-medium"
            >
              建立帳號 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
