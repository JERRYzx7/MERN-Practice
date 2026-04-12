import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { clsx } from "clsx";

const navItems = [
  {
    to: "/dashboard",
    label: "主頁",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: "/groups",
    label: "群組",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
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
        className="hidden md:flex items-center justify-between px-6 py-3 bg-brand-surface/80 backdrop-blur-xl border-b border-white/5"
        role="banner"
      >
        <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-teal to-emerald-600 flex items-center justify-center shadow-glow-teal">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-pixel text-[10px] text-neon-teal text-glow-teal tracking-wider">
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
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-neon-teal bg-neon-teal/10 shadow-glow-teal"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-neon-teal transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-purple to-neon-teal flex items-center justify-center text-xs font-bold text-white">
              {(userName ?? "?")[0].toUpperCase()}
            </div>
            {userName ?? "使用者"}
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-neon-red px-3 py-1.5 rounded-lg border border-white/5 hover:border-neon-red/20 transition-all duration-200 cursor-pointer"
            aria-label="登出"
          >
            登出
          </button>
        </div>
      </header>

      {/* ── Mobile Top Bar ─────────────────────────────── */}
      <header
        className="flex md:hidden items-center justify-between px-4 py-3 bg-brand-surface/80 backdrop-blur-xl border-b border-white/5"
        role="banner"
      >
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-teal to-emerald-600 flex items-center justify-center shadow-glow-teal">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-pixel text-[9px] text-neon-teal tracking-wider">
            SplitQuest
          </span>
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-neon-teal transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-purple to-neon-teal flex items-center justify-center text-xs font-bold text-white">
            {(userName ?? "?")[0].toUpperCase()}
          </div>
        </Link>
      </header>

      {/* ── Mobile Bottom Nav ──────────────────────────── */}
      <nav
        aria-label="底部導覽"
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-brand-surface/90 backdrop-blur-xl border-t border-white/5"
      >
        <ul className="flex items-stretch" role="list">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-1 py-3 px-2 transition-all duration-200 w-full",
                    "min-h-[56px] touch-manipulation",
                    isActive
                      ? "text-neon-teal"
                      : "text-slate-500 hover:text-slate-300",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      {item.icon}
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-teal shadow-glow-teal" />
                      )}
                    </span>
                    <span className="text-[10px] font-medium leading-none">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-3 px-2 text-slate-500 hover:text-neon-red transition-colors w-full min-h-[56px] cursor-pointer"
              aria-label="登出"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="text-[10px] font-medium leading-none">登出</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
