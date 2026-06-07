import { createFileRoute } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, Flame, Zap, Award, Sparkles } from "lucide-react";
import { AvatarBubble, AvatarPicker } from "@/components/avatar-picker";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  if (!profile) return null;

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
        <div className="flex-1">
          <h1 className="text-2xl font-black">{profile.display_name || "Player"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
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
