import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useSettings } from "@/hooks/use-settings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Bell, Volume2, Palette, Info, RefreshCw, LogOut, Trash2,
  ShieldCheck, ShoppingBag, Dumbbell, User as UserIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/menu")({
  component: MenuPage,
});

function MenuPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const router = useRouter();
  const settings = useSettings();
  const [credits, setCredits] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const onDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Best-effort wipe of user-owned rows (RLS-protected so safe).
      await supabase.from("notes").delete().eq("user_id", user.id);
      await supabase.from("user_progress").delete().eq("user_id", user.id);
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await supabase.from("game_scores").delete().eq("user_id", user.id);
      toast.success("Your data was removed", { description: "Signing you out." });
      await signOut();
      router.navigate({ to: "/" });
    } catch (e: any) {
      toast.error("Could not delete account", { description: e?.message ?? "Try again later." });
    } finally {
      setDeleting(false);
      setDelOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-black">Menu Settings</h1>

      <div className="glass mt-4 rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Player</p>
        <h2 className="mt-1 text-lg font-bold">{profile?.display_name || "Player"}</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <div className="glass mt-4 divide-y divide-border/60 rounded-2xl">
        <Toggle
          icon={Palette}
          label={`Appearance (${settings.appearance === "dark" ? "Dark" : "Light"})`}
          value={settings.appearance === "dark"}
          onChange={(v) => settings.setAppearance(v ? "dark" : "light")}
        />
        <Toggle
          icon={Bell}
          label="Notifications"
          value={settings.notifications}
          onChange={(v) => {
            settings.setNotifications(v);
            if (v) settings.notify("Notifications on", "You'll get learning reminders.");
          }}
        />
        <Toggle
          icon={Volume2}
          label="Sounds"
          value={settings.sounds}
          onChange={(v) => {
            settings.setSounds(v);
            if (v) setTimeout(() => settings.playBeep(), 50);
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link to="/profile" className="glass flex flex-col items-center gap-1 rounded-2xl p-3 text-xs">
          <UserIcon className="h-4 w-4" /> Profile
        </Link>
        <Link to="/practice" className="glass flex flex-col items-center gap-1 rounded-2xl p-3 text-xs">
          <Dumbbell className="h-4 w-4" /> Practice
        </Link>
        <Link to="/shop" className="glass flex flex-col items-center gap-1 rounded-2xl p-3 text-xs">
          <ShoppingBag className="h-4 w-4" /> Shop
        </Link>
      </div>

      {isAdmin && (
        <Link to="/admin" className="glass mt-4 flex items-center gap-3 rounded-2xl p-4 hover:border-[var(--neon)]/60">
          <ShieldCheck className="h-5 w-5 text-[var(--neon)]" />
          <div className="flex-1">
            <p className="text-sm font-bold">Admin Dashboard</p>
            <p className="text-xs text-muted-foreground">Manage users, content & analytics</p>
          </div>
        </Link>
      )}

      <div className="glass mt-4 divide-y divide-border/60 rounded-2xl">
        <Row icon={Info} label="Credits" onClick={() => setCredits(true)} />
        <Row
          icon={RefreshCw}
          label="Switch Account"
          onClick={async () => { await signOut(); router.navigate({ to: "/login" }); }}
        />
        <Row
          icon={LogOut}
          label="Log Out"
          onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
        />
        <Row icon={Trash2} label="Delete Account" danger onClick={() => setDelOpen(true)} />
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Batch 2026 AP4 Group 11 · All rights reserved
      </p>

      <Dialog open={credits} onOpenChange={setCredits}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credits</DialogTitle>
            <DialogDescription>FUNPHY1 — Fundamental Physics 1</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="font-bold">Team:</span> Batch 2026 · AP4 · Group 11</p>
            <p><span className="font-bold">Stack:</span> React · TanStack Start · Lovable Cloud</p>
            <p className="text-muted-foreground">Built with love for learning physics.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This will permanently remove your progress, notes and game scores. You'll be signed out.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDelOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Toggle({ icon: Icon, label, value, onChange }: { icon: any; label: string; value: boolean; onChange: (v: boolean) => void; }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-4">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm">{label}</span>
      <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-[var(--neon)]" : "bg-muted"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function Row({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick?: () => void; danger?: boolean; }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/30 ${danger ? "text-destructive" : ""}`}>
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
    </button>
  );
}
