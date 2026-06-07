import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronLeft, Heart, RotateCw, Trophy, Zap, Gem, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useRefreshProfile } from "@/hooks/use-profile";
import { useSettings } from "@/hooks/use-settings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/mini-game/$slug")({
  component: MiniGame,
});

type Q = { q: string; choices: string[]; answer: number; explain?: string };

const GAMES: Record<string, { name: string; color: string; xp: number; gems: number; threshold: number; unlockHint: string; realWorld: { title: string; story: string; takeaway: string }; questions: Q[] }> = {
  "force-builder": {
    name: "Force Diagram Builder",
    color: "var(--cyan)",
    xp: 35, gems: 10, threshold: 150,
    unlockHint: "Complete Unit 6 first.",
    realWorld: {
      title: "Pushing a shopping cart",
      story: "When you push a cart, the harder you push (force) and the lighter the cart (mass), the faster it speeds up — that's Newton's Second Law in action at the grocery store.",
      takeaway: "F = m × a — every push you feel in real life follows this rule.",
    },
    questions: [
      { q: "A 5 kg box accelerates at 2 m/s². What net force is acting on it?", choices: ["2.5 N", "5 N", "10 N", "25 N"], answer: 2, explain: "F = ma = 5·2 = 10 N" },
      { q: "Two forces, 3 N right and 4 N up, are perpendicular. What is the net force magnitude?", choices: ["1 N", "5 N", "7 N", "12 N"], answer: 1, explain: "√(3²+4²) = 5 N" },
      { q: "If net force on an object is zero, the object…", choices: ["Stops immediately", "Speeds up", "Keeps constant velocity", "Reverses"], answer: 2, explain: "Newton's 1st law." },
      { q: "Mass doubles, force stays the same. Acceleration…", choices: ["Doubles", "Halves", "Stays", "Quadruples"], answer: 1, explain: "a = F/m, so a halves." },
      { q: "Reaction force to gravity pulling you down on the floor is…", choices: ["Friction", "Tension", "Normal force", "Weight"], answer: 2, explain: "Normal force from the floor." },
    ],
  },
  "kinematics-jump": {
    name: "Kinematics Jump",
    color: "var(--xp)",
    xp: 30, gems: 8, threshold: 80,
    unlockHint: "Complete Unit 3 first.",
    realWorld: {
      title: "Riding a bike to school",
      story: "Your speed, the time you ride, and how quickly you accelerate from a stop sign all describe motion. Coasting downhill, gravity adds acceleration even without pedaling.",
      takeaway: "Kinematics tells you where you'll be and how fast — used by GPS, cars, and roller coasters.",
    },
    questions: [
      { q: "v = 10 m/s, t = 2 s, a = 0. What is displacement?", choices: ["5 m", "10 m", "20 m", "40 m"], answer: 2, explain: "d = vt = 20 m" },
      { q: "Object starts at rest, a = 3 m/s². Velocity after 4 s?", choices: ["7 m/s", "12 m/s", "0.75 m/s", "3 m/s"], answer: 1, explain: "v = at = 12 m/s" },
      { q: "Free-falling object after 2 s (g=10): velocity?", choices: ["5 m/s", "10 m/s", "20 m/s", "40 m/s"], answer: 2, explain: "v = gt = 20 m/s" },
      { q: "u=0, a=2 m/s², t=5s. Displacement?", choices: ["10 m", "25 m", "50 m", "5 m"], answer: 1, explain: "d = ½at² = 25 m" },
      { q: "Velocity changes from 4 to 20 m/s in 4 s. Acceleration?", choices: ["1 m/s²", "4 m/s²", "5 m/s²", "16 m/s²"], answer: 1, explain: "a = Δv/Δt = 16/4 = 4" },
    ],
  },
  "momentum-crash": {
    name: "Momentum Match",
    color: "var(--xp)",
    xp: 35, gems: 10, threshold: 60,
    unlockHint: "Complete Unit 3 first.",
    realWorld: {
      title: "Billiards / pool table",
      story: "When the cue ball strikes another ball, momentum transfers between them. The total momentum before and after the hit stays the same — that's why a fast cue can stop dead while sending the target ball flying.",
      takeaway: "Momentum (p = m·v) is conserved in collisions — used in car crash safety, rockets, and sports.",
    },
    questions: [
      { q: "A 2 kg ball at 3 m/s. Momentum?", choices: ["1.5 kg·m/s", "3 kg·m/s", "6 kg·m/s", "9 kg·m/s"], answer: 2, explain: "p = mv = 6" },
      { q: "Inelastic collision: 2 kg @ 4 m/s hits 2 kg at rest, they stick. Final v?", choices: ["1 m/s", "2 m/s", "4 m/s", "8 m/s"], answer: 1, explain: "Conservation: 2·4 = 4·v → v = 2" },
      { q: "Conservation of momentum requires…", choices: ["No external force", "Equal masses", "Same direction", "Elastic only"], answer: 0 },
      { q: "Elastic collision conserves…", choices: ["Only momentum", "Only KE", "Both momentum and KE", "Neither"], answer: 2 },
      { q: "Impulse equals change in…", choices: ["Velocity", "Mass", "Momentum", "Energy"], answer: 2, explain: "J = Δp" },
    ],
  },
  "acceleration-adventure": {
    name: "Acceleration Adventure",
    color: "var(--cyan)",
    xp: 25, gems: 6, threshold: 30,
    unlockHint: "Complete Unit 2 first.",
    realWorld: {
      title: "Stepping on the gas pedal",
      story: "When a car goes from 0 to 60 km/h, it's accelerating. Press harder, the change in velocity per second goes up. Brake hard and you decelerate — the same idea, just negative.",
      takeaway: "Acceleration = change in velocity ÷ time. It's what your body feels as a 'push' in any moving vehicle.",
    },
    questions: [
      { q: "Velocity changes from 0 to 20 m/s in 5 s. Acceleration?", choices: ["2 m/s²", "4 m/s²", "5 m/s²", "100 m/s²"], answer: 1, explain: "a = Δv/Δt = 20/5 = 4" },
      { q: "Object at 30 m/s decelerates at 5 m/s². Time to stop?", choices: ["3 s", "5 s", "6 s", "15 s"], answer: 2, explain: "t = v/a = 30/5 = 6 s" },
      { q: "Free fall on Earth has acceleration ≈", choices: ["1.6 m/s²", "9.8 m/s²", "20 m/s²", "0 m/s²"], answer: 1 },
      { q: "If a v-t graph is a straight horizontal line, acceleration is…", choices: ["Increasing", "Zero", "Negative", "Infinite"], answer: 1 },
      { q: "Units of acceleration are…", choices: ["m/s", "m/s²", "kg·m/s", "N"], answer: 1 },
    ],
  },
  "energy-transfer": {
    name: "Energy Transfer",
    color: "var(--streak)",
    xp: 30, gems: 8, threshold: 90,
    unlockHint: "Complete Unit 4 first.",
    realWorld: {
      title: "A roller coaster drop",
      story: "At the top of the hill the coaster has stored (potential) energy. As it drops, that energy converts into kinetic energy — speed. Friction and air drag turn a bit into heat and sound.",
      takeaway: "Energy is never lost — it just changes form. KE = ½mv² powers everything from cars to wind turbines.",
    },
    questions: [
      { q: "Kinetic energy of a 2 kg object at 4 m/s?", choices: ["8 J", "16 J", "32 J", "4 J"], answer: 1, explain: "KE = ½mv² = ½·2·16 = 16 J" },
      { q: "If speed doubles, KE becomes…", choices: ["2×", "3×", "4×", "Same"], answer: 2, explain: "KE ∝ v²" },
      { q: "Mass triples, speed same. KE becomes…", choices: ["Same", "2×", "3×", "9×"], answer: 2 },
      { q: "Units of kinetic energy?", choices: ["N", "J", "W", "kg·m/s"], answer: 1 },
      { q: "An object at rest has KE…", choices: ["Maximum", "Zero", "Negative", "Infinite"], answer: 1 },
    ],
  },
  "energy-flow": {
    name: "Energy Flow",
    color: "var(--gem)",
    xp: 32, gems: 9, threshold: 120,
    unlockHint: "Complete Unit 5 first.",
    realWorld: {
      title: "Charging your phone",
      story: "Electrical energy from the wall flows into your battery (chemical energy), then into the screen as light and into the speaker as sound. Power (watts) measures how fast that energy moves.",
      takeaway: "Power = work ÷ time. Higher wattage charges faster — same physics, different scale, from light bulbs to power plants.",
    },
    questions: [
      { q: "Work done by 10 N force over 3 m (same direction)?", choices: ["3 J", "13 J", "30 J", "0 J"], answer: 2, explain: "W = F·d = 30 J" },
      { q: "Elastic collisions conserve…", choices: ["Only KE", "Only momentum", "Both KE and momentum", "Neither"], answer: 2 },
      { q: "Power is…", choices: ["Energy × time", "Energy / time", "Force × mass", "Work × distance"], answer: 1, explain: "P = W/t" },
      { q: "Unit of power is…", choices: ["Joule", "Newton", "Watt", "Pascal"], answer: 2 },
      { q: "Energy can be…", choices: ["Created", "Destroyed", "Transformed", "All"], answer: 2, explain: "Conservation of energy." },
    ],
  },
};

function MiniGame() {
  const { slug } = Route.useParams();
  const game = GAMES[slug];
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const refresh = useRefreshProfile();
  const { playBeep, notify } = useSettings();

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const order = useMemo(() => {
    if (!game) return [] as number[];
    return [...game.questions.keys()].sort(() => Math.random() - 0.5);
  }, [game]);

  if (!game) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Unknown game.</p>
        <Link to="/mini-games" className="mt-4 inline-block text-primary">Back to Mini Games</Link>
      </div>
    );
  }

  const physScore = profile?.physics_score ?? 0;
  if (physScore < game.threshold) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-xl font-black">{game.name} is locked</h1>
        <p className="mt-2 text-sm text-muted-foreground">{game.unlockHint}</p>
        <Link to="/mini-games" className="mt-4 inline-block rounded-full bg-secondary px-4 py-2 text-sm font-bold">Back</Link>
      </div>
    );
  }

  const current = game.questions[order[step]];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === current.answer) {
      setScore((s) => s + 1);
      playBeep();
    } else {
      setLives((l) => l - 1);
    }
    setTimeout(() => {
      const nextStep = step + 1;
      const outOfLives = i !== current.answer && lives - 1 <= 0;
      if (nextStep >= game.questions.length || outOfLives) finish(i === current.answer ? score + 1 : score);
      else { setStep(nextStep); setPicked(null); }
    }, 1100);
  };

  const finish = async (finalScore: number) => {
    setDone(true);
    if (!user || !profile) return;
    const passed = finalScore >= 3;
    const xpEarn = passed ? game.xp : Math.round(game.xp / 2);
    const gemEarn = passed ? game.gems : 0;
    await supabase.from("profiles").update({
      xp: profile.xp + xpEarn,
      gems: profile.gems + gemEarn,
    }).eq("id", user.id);

    const { data: existing } = await supabase
      .from("game_scores").select("id, high_score, times_played")
      .eq("user_id", user.id).eq("game_name", slug).eq("level", 1).maybeSingle();
    const next = {
      high_score: Math.max(existing?.high_score ?? 0, finalScore),
      times_played: (existing?.times_played ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };
    if (existing) await supabase.from("game_scores").update(next).eq("id", existing.id);
    else await supabase.from("game_scores").insert({ user_id: user.id, game_name: slug, level: 1, ...next } as any);

    refresh();
    notify(`${game.name} complete!`, `+${xpEarn} XP, +${gemEarn} 💎`);
    if (passed) toast.success(`+${xpEarn} XP, +${gemEarn} gems`);
  };

  const replay = () => {
    setStep(0); setScore(0); setLives(3); setPicked(null); setDone(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <div className="flex items-center justify-between">
        <Link to="/mini-games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`h-4 w-4 ${i < lives ? "text-[var(--heart)]" : "text-muted"}`} fill={i < lives ? "currentColor" : "none"} />
          ))}
        </div>
      </div>

      <h1 className="mt-2 text-2xl font-black" style={{ color: game.color }}>{game.name}</h1>
      <p className="text-xs text-muted-foreground">Round {Math.min(step + 1, game.questions.length)} of {game.questions.length} · Score {score}</p>

      {!done && (
        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-base font-bold">{current.q}</p>
          <div className="mt-4 grid gap-2">
            {current.choices.map((c, i) => {
              const isAns = i === current.answer;
              const state = picked === null ? "" : i === picked
                ? (isAns ? "border-emerald-500 bg-emerald-500/15" : "border-red-500 bg-red-500/15")
                : (isAns ? "border-emerald-500/60 bg-emerald-500/5" : "");
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`flex items-center justify-between rounded-xl border-2 border-border bg-secondary/40 px-4 py-3 text-left text-sm font-medium transition ${state}`}
                >
                  <span>{c}</span>
                  {picked !== null && i === current.answer && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {picked === i && i !== current.answer && <XCircle className="h-4 w-4 text-red-500" />}
                </button>
              );
            })}
          </div>
          {picked !== null && current.explain && (
            <p className="mt-3 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">{current.explain}</p>
          )}
        </motion.div>
      )}

      {!done && (
        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" style={{ color: game.color }} />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Real-World Example</p>
          </div>
          <p className="mt-2 text-sm font-bold">{game.realWorld.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{game.realWorld.story}</p>
          <p className="mt-2 text-xs italic" style={{ color: game.color }}>💡 {game.realWorld.takeaway}</p>
        </div>
      )}

      {done && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <Trophy className="mx-auto h-10 w-10 text-[var(--xp)]" />
          <p className="mt-2 text-lg font-black">Game Complete!</p>
          <p className="text-sm text-muted-foreground">Score: {score} / {game.questions.length}</p>
          <div className="mt-3 flex justify-center gap-3 text-sm font-bold">
            <span className="inline-flex items-center gap-1 text-[var(--xp)]"><Zap className="h-4 w-4" />+{score >= 3 ? game.xp : Math.round(game.xp / 2)} XP</span>
            <span className="inline-flex items-center gap-1 text-[var(--gem)]"><Gem className="h-4 w-4" />+{score >= 3 ? game.gems : 0}</span>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={replay} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              <RotateCw className="h-4 w-4" /> Play again
            </button>
            <button onClick={() => router.navigate({ to: "/mini-games" })} className="rounded-full bg-secondary px-4 py-2 text-sm font-bold">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
