import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Lock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/game-map")({
  component: GameMap,
});

// Curved positions for nodes along a winding path
const POSITIONS = [
  { top: "82%", left: "20%" },
  { top: "65%", left: "55%" },
  { top: "50%", left: "30%" },
  { top: "30%", left: "60%" },
  { top: "12%", left: "40%" },
];

function GameMap() {
  const { data: profile } = useProfile();
  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").order("order_index");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Game Map</p>
        <h1 className="text-3xl font-black">
          Physica <span className="gradient-text italic">Realm</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Tap a realm node to enter. New realms unlock as your physics score grows.
        </p>
      </div>

      <div className="relative mt-6 aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-background via-background to-[var(--neon)]/5">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_75%,var(--neon)_0,transparent_40%),radial-gradient(circle_at_75%_25%,var(--cyan)_0,transparent_40%)]" />
        {/* Curved dotted path */}
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <path
            d="M20,108 C 40,100 50,92 55,86 C 60,80 35,72 30,66 C 25,60 55,50 60,40 C 65,30 35,22 40,16"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
            fill="none"
            opacity="0.6"
          />
        </svg>

        {modules?.map((m, i) => {
          const pos = POSITIONS[i] ?? { top: "50%", left: "50%" };
          const unlocked = i === 0 || (profile?.physics_score ?? 0) >= i * 30;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pos.top, left: pos.left }}
            >
              <Link
                to={unlocked ? "/modules/$id" : "/game-map"}
                params={{ id: m.id }}
                className={`group flex flex-col items-center ${unlocked ? "" : "pointer-events-none"}`}
              >
                <div
                  className="grid h-16 w-16 place-items-center rounded-full text-xl font-black shadow-lg transition-transform group-hover:scale-110"
                  style={{
                    background: unlocked
                      ? `radial-gradient(circle at 30% 30%, ${m.color}, ${m.color}66)`
                      : "hsl(var(--muted))",
                    border: `2px solid ${unlocked ? m.color : "hsl(var(--border))"}`,
                    boxShadow: unlocked ? `0 0 24px ${m.color}66` : undefined,
                    color: unlocked ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {unlocked ? m.order_index : <Lock className="h-5 w-5" />}
                </div>
                <span className="mt-1 max-w-[120px] text-center text-[10px] font-bold leading-tight text-foreground">
                  {m.title}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="glass mt-4 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--neon)]" />
          <p className="text-sm font-bold">{profile?.display_name || "Player"}</p>
          <span className="ml-auto text-xs text-muted-foreground">{profile?.league}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-to-r from-[var(--neon)] to-[var(--cyan)]"
            style={{ width: `${Math.min(100, ((profile?.physics_score ?? 0) / 200) * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Physics score {profile?.physics_score ?? 0} / 200
        </p>
      </div>

      <p className="mt-4 text-center text-xs italic text-muted-foreground">
        More units coming soon — clear more realms for unlock learning.
      </p>
    </div>
  );
}
