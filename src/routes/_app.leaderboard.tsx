import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Crown, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/leaderboard")({
  component: LeaderboardPage,
});

type Row = {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  league: string;
  streak: number;
};

function LeaderboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<Row[]> => {
      // Preferred: SECURITY DEFINER RPC (see migration).
      const { data, error } = await (supabase as any).rpc("get_leaderboard", { _limit: 50 });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ ...r, rank: Number(r.rank) }));
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-2xl p-5 text-center"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--xp)]/15 blur-3xl" />
        <Trophy className="mx-auto h-8 w-8 text-[var(--xp)]" />
        <h1 className="mt-2 text-2xl font-black">Leaderboard</h1>
        <p className="text-xs text-muted-foreground">Top physicists ranked by XP</p>
      </motion.div>

      {isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-14 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="glass mt-4 rounded-2xl p-4 text-sm text-destructive">
          Could not load leaderboard. {(error as Error).message}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="glass mt-4 rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No players yet. Be the first to earn XP!
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.map((row) => {
            const isMe = row.user_id === user?.id;
            const medal =
              row.rank === 1 ? "text-[var(--xp)]" :
              row.rank === 2 ? "text-muted-foreground" :
              row.rank === 3 ? "text-[var(--streak)]" : "";
            return (
              <motion.li
                key={row.user_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(row.rank, 10) * 0.02 }}
                className={`glass flex items-center gap-3 rounded-xl p-3 ${
                  isMe ? "border-[var(--neon)]/70 ring-1 ring-[var(--neon)]/40" : ""
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-black ${medal}`}>
                  {row.rank <= 3 ? (
                    row.rank === 1 ? <Crown className="h-4 w-4" /> : <Medal className="h-4 w-4" />
                  ) : (
                    row.rank
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold">
                      {row.display_name}{isMe && <span className="ml-1 text-[10px] text-[var(--neon)]">(You)</span>}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{row.league}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-sm font-black" style={{ color: "var(--xp)" }}>
                    <Zap className="h-3.5 w-3.5" /> {row.xp.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Flame className="h-3 w-3" /> {row.streak}d
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
