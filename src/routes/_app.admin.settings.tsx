import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useProfile, useRefreshProfile } from "@/hooks/use-profile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { AvatarBubble, AvatarPicker } from "@/components/avatar-picker";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Volume2, Palette, RefreshCw, LogOut, Sparkles, Save, KeyRound, Copy } from "lucide-react";

export const Route = createFileRoute("/_app/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { data: profile } = useProfile();
  const refresh = useRefreshProfile();
  const qc = useQueryClient();
  const { appearance, notifications, sounds, setAppearance, setNotifications, setSounds, playBeep, notify } =
    useSettings();

  const { data: profCode, refetch: refetchCode } = useQuery({
    queryKey: ["my-prof-code"],
    queryFn: async () => {
      const { data } = await supabase.rpc("my_professor_code");
      return (data as string | null) ?? "";
    },
  });

  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
  }, [profile?.display_name]);

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Could not save name", { description: error.message });
    refresh();
    toast.success("Name updated");
  };

  const saveProfCode = async () => {
    if (!user) return;
    const code = codeInput.trim();
    if (!code) return toast.error("Enter a code");
    setSavingCode(true);
    const { data: exists } = await supabase.rpc("professor_code_exists", { _code: code });
    if (exists && code !== profCode) {
      setSavingCode(false);
      return toast.error("That code is already taken");
    }
    const { error } = await supabase.rpc("grant_admin_role", {
      _invite_code: "FUNPHY-ADMIN-2026",
      _professor_code: code,
    });
    setSavingCode(false);
    if (error) return toast.error("Could not save code", { description: error.message });
    setCodeInput("");
    refetchCode();
    qc.invalidateQueries({ queryKey: ["my-prof-code"] });
    toast.success("Professor code saved", { description: "Share it with your students." });
  };

  const copyCode = async () => {
    if (!profCode) return;
    await navigator.clipboard.writeText(profCode);
    toast.success("Copied", { description: profCode });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
        <h2 className="text-lg font-black italic text-foreground">Settings</h2>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <AvatarBubble profile={profile} size={64} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <AvatarPicker
              profile={profile}
              trigger={
                <button className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold hover:bg-secondary/80">
                  <Sparkles className="h-3 w-3" /> Change Avatar
                </button>
              }
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Display name</label>
          <div className="mt-1 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--neon)]"
            />
            <button
              onClick={saveName}
              disabled={saving || !name.trim() || name.trim() === profile?.display_name}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--neon)] px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Professor code card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <KeyRound className="h-3.5 w-3.5" /> Professor Code
        </div>
        {profCode ? (
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-sm font-bold tracking-wide">
              {profCode}
            </code>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Set a code so students can link to your class and see your assignments.
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={profCode ? "Change code" : "e.g. PHYS-101"}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--neon)]"
          />
          <button
            onClick={saveProfCode}
            disabled={savingCode || !codeInput.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--neon)] px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {savingCode ? "…" : "Save"}
          </button>
        </div>
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
