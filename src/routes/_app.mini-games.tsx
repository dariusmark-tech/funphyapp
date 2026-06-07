import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, Lock } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/mini-games")({
  component: MiniGames,
});

const GAMES = [
  { slug: "vector-racer", name: "Frame of Reference", color: "var(--neon)", to: "/vector-racer" as const, threshold: 0, unlockHint: "Always available" },
  { slug: "acceleration-adventure", name: "Acceleration Adventure", color: "var(--cyan)", to: "/mini-game/acceleration-adventure" as const, threshold: 30, unlockHint: "Complete Unit 2 (score 30+)" },
  { slug: "momentum-crash", name: "Momentum Match", color: "var(--xp)", to: "/mini-game/momentum-crash" as const, threshold: 60, unlockHint: "Complete Unit 3 (score 60+)" },
  { slug: "energy-transfer", name: "Energy Transfer", color: "var(--streak)", to: "/mini-game/energy-transfer" as const, threshold: 90, unlockHint: "Complete Unit 4 (score 90+)" },
  { slug: "energy-flow", name: "Energy Flow", color: "var(--gem)", to: "/mini-game/energy-flow" as const, threshold: 120, unlockHint: "Complete Unit 5 (score 120+)" },
  { slug: "force-builder", name: "Force Diagram Builder", color: "var(--heart)", to: "/mini-game/force-builder" as const, threshold: 150, unlockHint: "Complete Unit 6 (score 150+)" },
];

function MiniGames() {
  const { data: profile } = useProfile();
  const score = profile?.physics_score ?? 0;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="text-2xl font-black">Mini Games</h1>
      <p className="text-sm text-muted-foreground">Quick physics challenges. Earn XP and gems.</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {GAMES.map((g, i) => {
          const unlocked = score >= g.threshold;
          const inner = (
            <div
              className={`glass flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl p-4 transition-transform ${unlocked ? "hover:scale-[1.02]" : "opacity-60"}`}
              style={unlocked ? { boxShadow: `inset 0 0 0 1px ${g.color}55` } : undefined}
            >
              <div className="grid h-16 w-16 place-items-center rounded-full" style={{ background: `${g.color}22`, border: `1px solid ${g.color}55` }}>
                {unlocked ? <Gamepad2 className="h-7 w-7" style={{ color: g.color }} /> : <Lock className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Game {i + 1}</div>
                <div className="text-sm font-bold">{g.name}</div>
                {!unlocked && <div className="mt-0.5 text-[9px] text-muted-foreground">{g.unlockHint}</div>}
              </div>
            </div>
          );
          if (unlocked) {
            return (
              <Link key={g.slug} to={g.to}>
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={g.slug}
              onClick={() => toast.info("Locked", { description: g.unlockHint })}
              className="text-left"
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
