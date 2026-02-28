import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { clsx } from "clsx";

const navItems = [
  { to: "/dashboard", label: "主頁", icon: "⊞" },
  { to: "/groups", label: "群組", icon: "⊕" },
];

export default function Navbar() {
  const { userName, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {/* ── Top Bar (desktop) ──────────────────────────── */}
      <header
        className="hidden md:flex items-center justify-between px-6 py-3 bg-pixel-panel border-b-2 border-pixel-border"
        role="banner"
      >
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="text-2xl" aria-hidden="true">⚔</span>
          <span className="font-pixel text-pixel-sm text-pixel-gold text-shadow-pixel">
            SplitQuest
          </span>
        </Link>

        <nav aria-label="主導覽">
          <ul className="flex items-center gap-1" role="list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2 px-4 py-2 font-pixel text-pixel-xs border-2 transition-all duration-75",
                      isActive
                        ? "border-pixel-gold text-pixel-gold bg-pixel-gold/10 shadow-pixel-gold translate-x-[2px] translate-y-[2px]"
                        : "border-transparent text-pixel-muted hover:text-pixel-text hover:border-pixel-border",
                    )
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/profile" className="font-vt text-vt-base text-pixel-muted hover:text-pixel-gold transition-colors">
            ▶ {userName ?? "冒險者"}
          </Link>
          <button
            onClick={handleLogout}
            className="font-pixel text-pixel-xs border-2 border-pixel-border px-3 py-2 text-pixel-muted hover:border-pixel-red hover:text-pixel-red transition-colors"
            aria-label="登出"
          >
            登出
          </button>
        </div>
      </header>

      {/* ── Mobile Top Bar ─────────────────────────────── */}
      <header
        className="flex md:hidden items-center justify-between px-4 py-3 bg-pixel-panel border-b-2 border-pixel-border"
        role="banner"
      >
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl" aria-hidden="true">⚔</span>
          <span className="font-pixel text-pixel-xs text-pixel-gold">
            SplitQuest
          </span>
        </Link>
        <Link to="/profile" className="font-vt text-vt-sm text-pixel-muted hover:text-pixel-gold transition-colors">
          {userName ?? "冒險者"}
        </Link>
      </header>

      {/* ── Mobile Bottom Nav ──────────────────────────── */}
      <nav
        aria-label="底部導覽"
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-pixel-panel border-t-2 border-pixel-border"
      >
        <ul className="flex items-stretch" role="list">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-1 py-3 px-2 transition-colors w-full",
                    "min-h-[56px] touch-manipulation", // 44px+ touch target
                    isActive
                      ? "text-pixel-gold border-t-2 border-pixel-gold -mt-[2px]"
                      : "text-pixel-muted hover:text-pixel-text",
                  )
                }
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="font-pixel text-[7px] leading-none">
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-3 px-2 text-pixel-muted hover:text-pixel-red transition-colors w-full min-h-[56px]"
              aria-label="登出"
            >
              <span className="text-xl leading-none" aria-hidden="true">✕</span>
              <span className="font-pixel text-[7px] leading-none">登出</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
