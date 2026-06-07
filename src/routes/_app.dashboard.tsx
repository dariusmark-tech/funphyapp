import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { ChevronRight, Map as MapIcon, Trophy, Gem, Sparkles } from "lucide-react";
import { AvatarBubble, AvatarPicker } from "@/components/avatar-picker";

export const Route = createFileRoute("/_app/dashboard")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data: prof } = await supabase
      .from("profiles")
      .select("placement_completed")
      .eq("id", s.session.user.id)
      .maybeSingle();
    if (prof && !prof.placement_completed) throw redirect({ to: "/placement" });
  },
  component: Home,
});

function Home() {
  const { data: profile } = useProfile();
  const { data: quest } = useQuery({
    queryKey: ["daily-quest"],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_quests")
        .select("*")
        .order("active_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (!profile) return <div className="mx-auto max-w-md px-4 py-8"><div className="glass h-48 animate-pulse rounded-2xl" /></div>;

  const xpInLevel = profile.xp % 500;
  const level = Math.floor(profile.xp / 500) + 1;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Player card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-2xl p-5 text-center"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--neon)]/15 blur-3xl" />
        <p className="text-xs italic text-muted-foreground">Player username:</p>
        <h1 className="mt-1 text-2xl font-black">{profile.display_name || "Player"}</h1>
        <div className="mt-3 grid place-items-center">
          <AvatarBubble profile={profile} size={88} />
        </div>
        <AvatarPicker
          profile={profile}
          trigger={
            <button className="mt-3 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold hover:bg-secondary/80">
              <Sparkles className="h-3 w-3" /> Change Avatar
            </button>
          }
        />
      </motion.div>

      {/* Level + progress */}
      <div className="glass mt-4 rounded-2xl p-4">
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">Level and Progress</p>
        <h2 className="mt-1 text-center text-lg font-black">{profile.league}</h2>
        <div className="mt-3 flex items-baseline justify-between text-xs">
          <span className="font-bold">Level {level}</span>
          <span className="text-muted-foreground">{xpInLevel} / 500 XP</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(xpInLevel / 500) * 100}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--neon)] to-[var(--cyan)]"
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Unit 2: Acceleration · Physics score {profile.physics_score}
        </p>
      </div>

      {/* Daily quest */}
      <div className="glass mt-4 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Daily Quest
        </div>
        <h3 className="mt-1 text-base font-bold">{quest?.description || "Earn 30 XP today"}</h3>
        <p className="text-xs text-muted-foreground">
          Reward:{" "}
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--gem)]">
            <Gem className="h-3 w-3" />
            {quest?.reward_gems ?? 10} gems
          </span>
        </p>
      </div>

      {/* Game Map CTA */}
      <Link
        to="/game-map"
        className="glass mt-4 flex items-center justify-between rounded-2xl p-4 hover:border-[var(--neon)]/60"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--neon)]/15 text-[var(--neon)]">
            <MapIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Enter Physica Realm</p>
            <p className="text-[11px] text-muted-foreground">Continue your journey</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
