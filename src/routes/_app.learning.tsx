import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, Video, FileText, NotebookPen } from "lucide-react";

export const Route = createFileRoute("/_app/learning")({
  component: LearningLayout,
});

const TABS: { to: any; label: string; icon: any; exact?: boolean }[] = [
  { to: "/learning", label: "Modules", icon: BookOpen, exact: true },
  { to: "/learning/videos", label: "Videos", icon: Video },
  { to: "/learning/references", label: "References", icon: FileText },
  { to: "/learning/notes", label: "My Notes", icon: NotebookPen },
];

function LearningLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-black">Learning Materials</h1>
      <p className="text-sm text-muted-foreground">Modules, videos, references and your notes.</p>

      <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl border border-border bg-background/40 p-1.5">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? path === to : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors ${
                active ? "bg-[var(--neon)]/15 text-[var(--neon)]" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
