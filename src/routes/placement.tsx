import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";

type Q = { q: string; a: string[]; correct: number };

const QUESTION_POOL: Q[] = [
  { q: "According to Newton's First Law, an object will:", a: ["Accelerate without force acting on it", "Remain at rest or move with constant velocity unless acted upon by a net force", "Always move in a circle", "Stop moving when a force is applied"], correct: 1 },
  { q: "What is the SI unit of acceleration?", a: ["m/s", "m/s²", "kg·m/s", "N·s"], correct: 1 },
  { q: "Newton's 2nd law states:", a: ["F = mv", "F = ma", "F = m/a", "F = m + a"], correct: 1 },
  { q: "Kinetic energy of a 2 kg object moving at 3 m/s?", a: ["6 J", "9 J", "12 J", "18 J"], correct: 1 },
  { q: "Two cars collide and stick together. Which quantity is conserved?", a: ["Kinetic energy", "Velocity", "Momentum", "Mass only"], correct: 2 },
  { q: "A scalar quantity has:", a: ["Magnitude only", "Direction only", "Both magnitude and direction", "Neither"], correct: 0 },
  { q: "Which is a vector quantity?", a: ["Mass", "Time", "Velocity", "Temperature"], correct: 2 },
  { q: "The SI unit of force is:", a: ["Joule", "Newton", "Watt", "Pascal"], correct: 1 },
  { q: "Weight of a 10 kg object on Earth (g = 9.8 m/s²)?", a: ["9.8 N", "98 N", "10 N", "980 N"], correct: 1 },
  { q: "Work is done when:", a: ["A force is applied", "An object moves", "A force causes displacement", "Energy is stored"], correct: 2 },
  { q: "Unit of power is:", a: ["Joule", "Newton", "Watt", "Pascal"], correct: 2 },
  { q: "Free-fall acceleration near Earth's surface is approximately:", a: ["1.6 m/s²", "9.8 m/s²", "15 m/s²", "20 m/s²"], correct: 1 },
  { q: "Momentum is defined as:", a: ["mass × velocity", "mass × acceleration", "force × time", "force × distance"], correct: 0 },
  { q: "An object in uniform circular motion has:", a: ["Zero acceleration", "Constant velocity", "Centripetal acceleration", "No net force"], correct: 2 },
  { q: "Newton's 3rd law is about:", a: ["Inertia", "F = ma", "Action–reaction pairs", "Gravity"], correct: 2 },
  { q: "The slope of a position–time graph represents:", a: ["Acceleration", "Velocity", "Force", "Displacement"], correct: 1 },
  { q: "Distance is to displacement as speed is to:", a: ["Acceleration", "Force", "Velocity", "Power"], correct: 2 },
  { q: "Which best describes friction?", a: ["Always helpful", "Force opposing motion", "Force that speeds objects up", "A type of gravity"], correct: 1 },
  { q: "Potential energy of a 2 kg object 5 m high (g = 10 m/s²)?", a: ["10 J", "50 J", "100 J", "25 J"], correct: 2 },
  { q: "1 Newton equals:", a: ["1 kg·m/s", "1 kg·m/s²", "1 kg/m·s²", "1 kg·m²/s"], correct: 1 },
];

// Deterministic PRNG so a given user always gets the same set (prevents reroll abuse)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function shuffleSeeded<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildUserAssessment(userId: string, count = 5): Q[] {
  const rng = mulberry32(hashStr(userId || "anon"));
  const picked = shuffleSeeded(QUESTION_POOL, rng).slice(0, count);
  // Also shuffle answer order per question
  return picked.map((q) => {
    const indices = shuffleSeeded(q.a.map((_, i) => i), rng);
    return {
      q: q.q,
      a: indices.map((i) => q.a[i]),
      correct: indices.indexOf(q.correct),
    };
  });
}

export const Route = createFileRoute("/placement")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data: prof } = await supabase
      .from("profiles")
      .select("placement_completed")
      .eq("id", s.session.user.id)
      .maybeSingle();
    if (prof?.placement_completed) throw redirect({ to: "/dashboard" });
    return { userId: s.session.user.id };
  },
  component: Placement,
});

type Stage = "intro" | "diagnostic" | "questions" | "results";

function Placement() {
  const nav = useNavigate();
  const { userId } = Route.useRouteContext();
  const QUESTIONS = useMemo(() => buildUserAssessment(userId, 5), [userId]);
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  const q = QUESTIONS[step];
  const tier = finalScore >= 4 ? "Advance" : finalScore >= 2 ? "Intermediate" : "Beginner";
  const feedback =
    finalScore >= 4
      ? "Excellent grasp of mechanics — strong foundation in vectors, motion, and energy."
      : finalScore >= 2
      ? "The user has a foundational understanding of Velocity, Momentum, and Forces."
      : "Recommend starting from the basics: vectors, motion, and free-body diagrams.";

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct) setScore((s) => s + 1);
  };

  const next = async () => {
    const newScore = score;
    if (step + 1 >= QUESTIONS.length) {
      setFinalScore(newScore);
      setStage("results");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({
            placement_completed: true,
            physics_score: newScore * 20,
            xp: newScore * 10,
          })
          .eq("id", user.id);
      }
    } else {
      setStep((s) => s + 1);
      setPicked(null);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-8">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <Toaster />
      <div className="relative z-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-3xl border-2 border-border bg-card p-7 shadow-xl"
            >
              <h2 className="text-center text-2xl font-black italic">User Assessment</h2>
              <div className="mt-6 rounded-2xl border-2 border-border bg-background/60 p-5 text-center text-sm leading-relaxed">
                <p className="font-bold">Ready to become the Master of Physics?</p>
                <p className="mt-3 text-muted-foreground">
                  Take our simple assessment and kick off your fun and exciting journey into the
                  realm of <span className="font-bold text-primary">"Physica"</span> and become
                  Master of Physics!
                </p>
              </div>
              <p className="mt-5 text-[11px] italic text-muted-foreground">
                Disclaimer: This Assessment is designed only to determine the user's/player's
                knowledge in Physics
              </p>
              <button
                onClick={() => setStage("diagnostic")}
                className="ml-auto mt-6 flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {stage === "diagnostic" && (
            <motion.div
              key="diag"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-3xl border-2 border-border bg-card p-7 shadow-xl"
            >
              <h2 className="text-center text-2xl font-black italic">Diagnostic Assessment</h2>
              <div className="mt-6 rounded-2xl border-2 border-border bg-background/60 p-5 text-center text-sm leading-relaxed">
                This assessment will identify the user's prior knowledge, strength, and weaknesses
                before engaging in the game.
                <p className="mt-3 text-muted-foreground">
                  It will include questions to gauge familiarity with physics concepts (e.g.,
                  vectors, motion, forces) and mathematical skills (e.g., algebra, calculus
                  basics).
                </p>
              </div>
              <button
                onClick={() => setStage("questions")}
                className="mx-auto mt-6 block rounded-full border-2 border-primary bg-background px-8 py-2.5 text-sm font-bold italic text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Start Assessment
              </button>
            </motion.div>
          )}

          {stage === "questions" && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-3xl border-2 border-border bg-card p-6 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Answer the {QUESTIONS.length} following physics questions</span>
                <span className="font-bold">{step + 1}/{QUESTIONS.length}</span>
              </div>
              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  animate={{ width: `${((step + (picked !== null ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-primary to-accent"
                />
              </div>

              <p className="text-sm font-bold">
                {step + 1}. {q.q}
              </p>
              <div className="mt-4 space-y-2">
                {q.a.map((opt, i) => {
                  const isCorrect = picked !== null && i === q.correct;
                  const isWrongPick = picked === i && i !== q.correct;
                  return (
                    <button
                      key={i}
                      disabled={picked !== null}
                      onClick={() => choose(i)}
                      className={`flex w-full items-start gap-2 rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-medium transition-all ${
                        isCorrect
                          ? "border-primary bg-primary/10 text-primary"
                          : isWrongPick
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border bg-background hover:border-primary/60"
                      }`}
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-current text-[10px] font-black">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      {isWrongPick && <XCircle className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={picked === null}
                onClick={next}
                className="ml-auto mt-5 flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
              >
                {step + 1 >= QUESTIONS.length ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {stage === "results" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-border bg-card p-7 shadow-xl"
            >
              <h2 className="text-center text-2xl font-black italic">Assessment Results</h2>
              <p className="mt-4 text-center text-sm font-bold">User's Results:</p>

              <div className="mt-4 space-y-2 rounded-2xl border-2 border-border bg-background/60 p-5 text-sm">
                <p>
                  <span className="font-bold">Score:</span> {finalScore}/{QUESTIONS.length}
                </p>
                <p>
                  <span className="font-bold">Level:</span>{" "}
                  <span className="font-black text-primary">{tier}</span>
                </p>
                <p>
                  <span className="font-bold">Feedback:</span>{" "}
                  <span className="text-muted-foreground">{feedback}</span>
                </p>
                <p>
                  <span className="font-bold">Recommended:</span>{" "}
                  <span className="text-muted-foreground">
                    focus on reviewing and practicing problem solving and free-body diagrams
                  </span>
                </p>
              </div>

              <p className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-center text-xs">
                Every player begins at <span className="font-bold text-primary">Beginner</span> —
                completed levels unlock harder ones.
              </p>

              <button
                onClick={() => nav({ to: "/dashboard" })}
                className="ml-auto mt-5 flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
