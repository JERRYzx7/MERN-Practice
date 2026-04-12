import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col relative">
      {/* Skip to main content (a11y) */}
      <a href="#main-content" className="skip-link">
        跳到主要內容
      </a>

      <Navbar />

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full"
        tabIndex={-1}
      >
        {children ?? <Outlet />}
      </main>

      {/* Ambient background decorations */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1]"
        aria-hidden="true"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(45,212,191,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(45,212,191,0.4) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Ambient glow orb - top right */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)",
          }}
        />
        {/* Ambient glow orb - bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}
