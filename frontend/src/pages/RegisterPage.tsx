import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const mutation = useMutation({
    mutationFn: () => userApi.register({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
    onSuccess: (res) => {
      login({ id: res.data.id, name: res.data.name, email: res.data.email, personalGroupId: res.data.personalGroupId, token: res.data.token });
      navigate("/dashboard");
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setApiError(err.status === 409 ? "此 Email 已被使用" : err.message);
      }
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e["name"] = "名稱至少 2 個字";
    if (!form.email.includes("@")) e["email"] = "Email 格式不正確";
    if (form.password.length < 8) e["password"] = "密碼至少 8 個字元";
    if (form.password !== form.confirm) e["confirm"] = "兩次密碼不一致";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setApiError("");
    if (validate()) mutation.mutate();
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)" }} aria-hidden="true" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)" }} aria-hidden="true" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-teal shadow-glow-purple mb-4 animate-float">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1 className="font-pixel text-[12px] text-neon-teal text-glow-teal tracking-wider">
            建立帳號
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            加入 SplitQuest 分帳行列
          </p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} noValidate aria-label="註冊表單">
            <div className="flex flex-col gap-4">
              <GlassInput
                label="使用者名稱"
                type="text"
                value={form.name}
                onChange={update("name")}
                error={errors["name"]}
                placeholder="輸入你的名稱"
                autoComplete="name"
                required
              />
              <GlassInput
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                error={errors["email"]}
                placeholder="hello@example.com"
                autoComplete="email"
                required
              />
              <GlassInput
                label="密碼"
                type="password"
                value={form.password}
                onChange={update("password")}
                error={errors["password"]}
                placeholder="至少 8 個字元"
                autoComplete="new-password"
                required
              />
              <GlassInput
                label="確認密碼"
                type="password"
                value={form.confirm}
                onChange={update("confirm")}
                error={errors["confirm"]}
                placeholder="再次輸入密碼"
                autoComplete="new-password"
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
                建立帳號
              </GlassButton>
            </div>
          </form>

          <p className="text-sm text-slate-500 text-center mt-5">
            已有帳號？{" "}
            <Link to="/login" className="text-neon-teal hover:text-neon-green transition-colors font-medium">
              返回登入 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
