import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { userApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";

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
    <div className="min-h-screen bg-pixel-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-6xl mb-4 animate-float-pixel" aria-hidden="true">🗡️</p>
          <h1 className="font-pixel text-pixel-base text-pixel-gold">
            建立帳號
          </h1>
          <p className="font-vt text-vt-base text-pixel-muted mt-2">
            加入分帳冒險的行列
          </p>
        </div>

        <div className="border-2 border-pixel-gold shadow-pixel-gold bg-pixel-panel p-6">
          <form onSubmit={handleSubmit} noValidate aria-label="註冊表單">
            <div className="flex flex-col gap-4">
              <PixelInput
                label="冒險者名稱"
                type="text"
                value={form.name}
                onChange={update("name")}
                error={errors["name"]}
                placeholder="輸入你的名稱..."
                autoComplete="name"
                required
              />
              <PixelInput
                label="Email"
                type="email"
                value={form.email}
                onChange={update("email")}
                error={errors["email"]}
                placeholder="hero@quest.com"
                autoComplete="email"
                required
              />
              <PixelInput
                label="密碼"
                type="password"
                value={form.password}
                onChange={update("password")}
                error={errors["password"]}
                placeholder="至少 8 個字元"
                autoComplete="new-password"
                required
              />
              <PixelInput
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
                ▶ 建立角色
              </PixelButton>
            </div>
          </form>

          <p className="font-vt text-vt-sm text-pixel-muted text-center mt-4">
            已有帳號？{" "}
            <Link to="/login" className="text-pixel-cyan hover:text-pixel-gold transition-colors">
              返回登入 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
