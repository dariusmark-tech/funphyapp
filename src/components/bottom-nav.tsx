import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, Gamepad2, BookOpen, Menu as MenuIcon, CalendarDays, Users, Settings as SettingsIcon } from "lucide-react";

const USER_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/game-map", label: "Map", icon: Map },
  { to: "/mini-games", label: "Mini Games", icon: Gamepad2 },
  { to: "/learning", label: "Learning", icon: BookOpen },
  { to: "/menu", label: "Menu", icon: MenuIcon },
] as const;

const ADMIN_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: CalendarDays, exact: true },
  { to: "/admin/users", label: "Players", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  const items = isAdmin ? ADMIN_ITEMS : USER_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const exact = "exact" in item ? item.exact : false;
          const active = exact ? path === item.to : (path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to)));
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold transition-colors ${
                  active ? "text-[var(--neon)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_6px_var(--neon)]" : ""}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
