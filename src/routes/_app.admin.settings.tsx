import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { Switch } from "@/components/ui/switch";
import { Bell, Volume2, Palette, RefreshCw, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { appearance, notifications, sounds, setAppearance, setNotifications, setSounds, playBeep, notify } =
    useSettings();

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
        <h2 className="text-lg font-black italic text-foreground">Settings</h2>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
        <Row icon={Palette} label={`Appearance (${appearance === "dark" ? "Dark" : "Light"})`}>
          <Switch
            checked={appearance === "dark"}
            onCheckedChange={(v) => setAppearance(v ? "dark" : "light")}
          />
        </Row>
        <Row icon={Bell} label="Notifications">
          <Switch
            checked={notifications}
            onCheckedChange={(v) => {
              setNotifications(v);
              if (v) notify("Notifications enabled", "You'll get updates here.");
            }}
          />
        </Row>
        <Row icon={Volume2} label="Sounds">
          <Switch
            checked={sounds}
            onCheckedChange={(v) => {
              setSounds(v);
              if (v) setTimeout(playBeep, 50);
            }}
          />
        </Row>
      </div>

      <button
        onClick={async () => {
          await signOut();
          router.navigate({ to: "/login" });
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm hover:bg-muted"
      >
        <RefreshCw className="h-4 w-4" /> Switch Account
      </button>
      <button
        onClick={async () => {
          await signOut();
          router.navigate({ to: "/" });
        }}
        className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/60 bg-card px-4 py-3 text-sm font-bold text-rose-500 shadow-sm hover:bg-rose-500/10"
      >
        <LogOut className="h-4 w-4" /> Log Out
      </button>

      <p className="pt-2 text-center text-[10px] italic text-muted-foreground">
        Batch 2026 AP4 Group 11 | All right reserved
      </p>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium italic text-foreground">{label}</span>
      {children}
    </div>
  );
}
