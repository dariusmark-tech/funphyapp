import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Flame, Zap, Gem } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import logo from "@/assets/funphy-logo.png";

export function AppHeader() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = path === "/admin" || path.startsWith("/admin/");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="FUNPHY" className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]" />
          <span className="text-xl font-black leading-none tracking-tight">
            FUN<span className="gradient-text">PHY</span>
          </span>
        </Link>

        {user && profile && !isAdmin && (
          <div className="ml-auto flex items-center gap-1">
            <Chip color="var(--streak)"><Flame className="h-3 w-3" />{profile.streak}</Chip>
            <Chip color="var(--xp)"><Zap className="h-3 w-3" />{profile.xp}</Chip>
            <Chip color="var(--gem)"><Gem className="h-3 w-3" />{profile.gems}</Chip>
            <Chip color="var(--heart)"><Heart className="h-3 w-3" fill="currentColor" />{profile.hearts}</Chip>
          </div>
        )}
      </div>
    </header>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
      style={{ background: `color-mix(in oklab, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in oklab, ${color} 30%, transparent)` }}
    >
      {children}
    </span>
  );
}
