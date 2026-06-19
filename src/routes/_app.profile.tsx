import { createFileRoute } from "@tanstack/react-router";
import { useProfile, useRefreshProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, Flame, Zap, Award, Sparkles, Pencil, Check, X } from "lucide-react";
import { AvatarBubble, AvatarPicker } from "@/components/avatar-picker";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const refresh = useRefreshProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const startEdit = () => {
    setName(profile.display_name ?? "");
    setEditing(true);
  };

  const saveName = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Name can't be empty");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Could not save", { description: error.message });
    refresh();
    toast.success("Name updated");
    setEditing(false);
  };

  const stats = [
    { label: "Total XP", value: profile.xp.toLocaleString(), icon: Zap, color: "var(--xp)" },
    { label: "Lifetime streak", value: `${profile.max_streak}d`, icon: Flame, color: "var(--streak)" },
    { label: "Physics Score", value: `${profile.physics_score}/200`, icon: Award, color: "var(--neon)" },
    { label: "League", value: profile.league, icon: Trophy, color: "var(--cyan)" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="glass flex items-center gap-5 rounded-2xl p-6">
        <AvatarBubble profile={profile} size={80} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={32}
                className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-1.5 text-lg font-bold outline-none focus:border-[var(--neon)]"
                placeholder="Your name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="rounded-full bg-[var(--neon)] p-2 text-primary-foreground disabled:opacity-50"
                aria-label="Save"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-full bg-secondary p-2"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black truncate">{profile.display_name || "Player"}</h1>
              <button
                onClick={startEdit}
                className="rounded-full bg-secondary p-1.5 hover:bg-secondary/80"
                aria-label="Edit name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <AvatarPicker
            profile={profile}
            trigger={
              <button className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold hover:bg-secondary/80">
                <Sparkles className="h-3 w-3" /> Change Avatar
              </button>
            }
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <s.icon className="h-5 w-5" style={{ color: s.color }} />
            <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
