import { Link, useLocation } from "wouter";
import { Home, ListTodo, Users, Coins, Activity } from "lucide-react";
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
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground pb-20">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-2xl border-b-0 pb-safe pt-2 px-6 flex justify-between items-center z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href;
          
          return (
            <Link key={tab.href} href={tab.href}>
              <div className="flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200">
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
      {health?.status && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-green-500/50 z-50" />
      )}
    </div>
  );
}
