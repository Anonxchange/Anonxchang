import { Link, useLocation } from "wouter";
import { Home, ListTodo, Users, Coins } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tasks", label: "Tasks", icon: ListTodo },
    { href: "/referral", label: "Referral", icon: Users },
    { href: "/tokens", label: "Tokens", icon: Coins },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">

      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside className="desktop-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <img
            src="https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png"
            alt="NOVA"
            className="w-10 h-10 rounded-xl shadow-md object-cover"
          />
          <div>
            <div className="font-bold text-base leading-tight">NOVA</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Airdrop</div>
          </div>
        </div>

        {/* Nav links */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href;
          return (
            <Link key={tab.href} href={tab.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all font-medium text-sm",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <Icon className="w-5 h-5" />
                {tab.label}
              </div>
            </Link>
          );
        })}

        <div className="mt-auto">
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#229ED9] hover:bg-[#229ED9]/10 transition-colors"
          >
            <FaTelegram className="w-5 h-5" />
            Open in Telegram
          </a>
          {health?.status && (
            <div className="flex items-center gap-2 px-4 py-2 mt-2 text-xs text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              API Connected
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="desktop-main flex-1 flex flex-col">
        {/* Desktop top bar */}
        <header className="desktop-nav hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-border sticky top-0 z-40">
          <h2 className="font-semibold text-base text-foreground capitalize">
            {tabs.find(t => t.href === location)?.label || "Home"}
          </h2>
          <a
            href="https://t.me/your_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#229ED9] text-white text-sm font-semibold hover:bg-[#1a8bbf] transition-colors shadow-sm"
          >
            <FaTelegram className="w-4 h-4" />
            Telegram Bot
          </a>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────────── */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border border-border rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-safe pt-3 px-4 justify-between items-center z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href;
          return (
            <Link key={tab.href} href={tab.href}>
              <div className="flex flex-col items-center justify-center px-4 py-1 cursor-pointer">
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-0.5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
