import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-pixel-bg flex flex-col">
      {/* Skip to main content (a11y) */}
      <a href="#main-content" className="skip-link">
        跳到主要內容
      </a>

      <Navbar />

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-4xl mx-auto w-full"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {/* Pixel grid background decoration */}
      <div
        className="fixed inset-0 pointer-events-none z-[-1] opacity-5"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(251,191,36,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,191,36,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
