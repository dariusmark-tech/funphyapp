import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, RotateCw, Trophy, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/vector-racer")({
  component: VectorRacer,
});

type Obs = { x: number; w: number; h: number };

function VectorRacer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { playBeep } = useSettings();
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ y: 0, vy: 0, t: 0, obs: [] as Obs[], speed: 4, score: 0, over: false });

  const { data: best, refetch } = useQuery({
    queryKey: ["game-best", user?.id, "vector-racer"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("game_scores").select("high_score, times_played")
        .eq("user_id", user!.id).eq("game_name", "vector-racer").maybeSingle();
      return data;
    },
  });

  const start = () => {
    stateRef.current = { y: 0, vy: 0, t: 0, obs: [], speed: 4, score: 0, over: false };
    setScore(0); setOver(false); setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const W = cvs.width, H = cvs.height, GROUND = H - 40;
    let raf = 0;

    const jump = () => {
      const s = stateRef.current;
      if (s.over) return;
      if (s.y >= -1) { s.vy = -11; playBeep(); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); } };
    cvs.addEventListener("pointerdown", jump);
    window.addEventListener("keydown", onKey);

    const loop = () => {
      const s = stateRef.current;
      s.t++;
      s.vy += 0.55;
      s.y += s.vy;
      if (s.y > 0) { s.y = 0; s.vy = 0; }

      if (s.t % Math.max(60, 110 - Math.floor(s.score / 5)) === 0) {
        s.obs.push({ x: W + 10, w: 16 + Math.random() * 14, h: 26 + Math.random() * 26 });
      }
      s.obs.forEach((o) => (o.x -= s.speed));
      s.obs = s.obs.filter((o) => o.x + o.w > 0);
      s.speed = Math.min(9, 4 + s.score / 30);

      // collision
      const px = 50, pw = 26, ph = 28;
      const py = GROUND + s.y - ph;
      for (const o of s.obs) {
        const oy = GROUND - o.h;
        if (px < o.x + o.w && px + pw > o.x && py < oy + o.h && py + ph > oy) {
          s.over = true;
          break;
        }
      }

      // draw
      ctx.fillStyle = getCss("--background");
      ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = getCss("--grid-color") || "rgba(120,120,180,0.2)";
      ctx.lineWidth = 1;
      const off = (s.t * s.speed) % 40;
      for (let x = -off; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      // ground
      ctx.fillStyle = getCss("--primary");
      ctx.fillRect(0, GROUND, W, 2);
      // player
      ctx.fillStyle = getCss("--accent");
      ctx.fillRect(px, py, pw, ph);
      // obstacles
      ctx.fillStyle = getCss("--destructive");
      for (const o of s.obs) ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);

      if (!s.over) {
        s.score += 1;
        if (s.score % 6 === 0) setScore(Math.floor(s.score / 6));
        raf = requestAnimationFrame(loop);
      } else {
        setOver(true); setRunning(false);
        const final = Math.floor(s.score / 6);
        setScore(final);
        // persist
        if (user) {
          (async () => {
            const { data: existing } = await supabase
              .from("game_scores").select("id, high_score, times_played")
              .eq("user_id", user.id).eq("game_name", "vector-racer").eq("level", 1).maybeSingle();
            const next = {
              high_score: Math.max(existing?.high_score ?? 0, final),
              times_played: (existing?.times_played ?? 0) + 1,
              updated_at: new Date().toISOString(),
            };
            if (existing) {
              await supabase.from("game_scores").update(next).eq("id", existing.id);
            } else {
              await supabase.from("game_scores").insert({
                user_id: user.id, game_name: "vector-racer", level: 1, ...next,
              } as any);
            }
            refetch();
          })();
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cvs.removeEventListener("pointerdown", jump);
      window.removeEventListener("keydown", onKey);
    };
  }, [running, user, best, playBeep, refetch]);

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <Link to="/mini-games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-black">Vector Racer</h1>
        <div className="flex items-center gap-1 text-xs font-bold text-primary">
          <Trophy className="h-4 w-4" /> Best: {best?.high_score ?? 0}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Tap the canvas (or Space) to jump. Avoid the red obstacles.</p>

      <div className="mt-3 rounded-2xl border border-border bg-card p-2">
        <canvas ref={canvasRef} width={360} height={220} className="w-full touch-none rounded-xl" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-bold">Score: <span className="text-primary">{score}</span></div>
        {!running ? (
          <button onClick={start} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30">
            {over ? (<><RotateCw className="h-4 w-4" /> Play again</>) : "Start"}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Running…</span>
        )}
      </div>

      {over && (
        <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4 text-center text-sm">
          <p className="font-bold">Game Over</p>
          <p className="text-muted-foreground">You scored {score}.</p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Real-World Example</p>
        </div>
        <p className="mt-2 text-sm font-bold">Riding in a moving train</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          When you sit in a moving train and toss a coin straight up, it lands back in your hand — from your frame of reference, it goes straight up and down. But to someone standing on the platform, the coin actually travels in an arc, because they see it moving forward with the train too.
        </p>
        <p className="mt-2 text-xs italic text-primary">💡 Motion depends on the observer's frame of reference — the same event can look different to different viewers.</p>
      </div>
    </div>
  );
}

function getCss(name: string) {
  if (typeof window === "undefined") return "#000";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
}
