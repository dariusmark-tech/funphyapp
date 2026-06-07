import { createFileRoute, useRouter, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRefreshProfile } from "@/hooks/use-profile";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  PlayCircle,
  Sigma,
  Lightbulb,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/lessons/$id/")({
  component: LessonReader,
});

type EquationItem = { label?: string; formula: string };

function LessonReader() {
  const { id } = Route.useParams();
  const router = useRouter();
  const navigate = useNavigate();
  const { user } = useAuth();
  const refresh = useRefreshProfile();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, modules(title, order_index, color)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Sibling lessons in the same module — for Prev / Next navigation
  const { data: siblings } = useQuery({
    queryKey: ["lesson-siblings", lesson?.module_id],
    enabled: !!lesson?.module_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("module_id", lesson!.module_id)
        .order("order_index");
      return data ?? [];
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["lesson-progress", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("lesson_id", id)
        .maybeSingle();
      return data;
    },
  });

  const idx = siblings?.findIndex((s) => s.id === id) ?? -1;
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = siblings && idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const complete = useMutation({
    mutationFn: async () => {
      if (!user || !lesson) return;
      await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lesson.id,
          module_id: lesson.module_id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" } as any,
      );
      const { data: prof } = await supabase
        .from("profiles")
        .select("xp, gems")
        .eq("id", user.id)
        .single();
      await supabase
        .from("profiles")
        .update({ xp: (prof?.xp ?? 0) + 10, gems: (prof?.gems ?? 0) + 2 })
        .eq("id", user.id);
    },
    onSuccess: () => {
      toast.success("+10 XP · +2 Gems", { description: "Lesson complete!" });
      refresh();
    },
  });

  const handleContinue = () => {
    if (!lesson) return;
    navigate({ to: "/lessons/$id/assessment", params: { id: lesson.id } });
  };

  const equations = (lesson?.equations as EquationItem[] | null) ?? [];
  const keyPoints = (lesson?.key_points as string[] | null) ?? [];

  // Convert YouTube watch URL → embed URL if needed
  const embedUrl = (() => {
    const u = lesson?.video_url;
    if (!u) return null;
    if (u.includes("/embed/")) return u;
    const m = u.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : u;
  })();

  return (
    <div className="mx-auto max-w-md px-4 py-4 pb-28">
      <button
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {isLoading || !lesson ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted/40" />
      ) : (
        <>
          {/* Header */}
          <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            {(lesson as any).modules?.title} · Lesson {lesson.order_index}
            {siblings && ` of ${siblings.length}`}
          </div>
          <h1 className="mt-1 text-2xl font-black leading-tight">{lesson.title}</h1>

          {/* Progress dots */}
          {siblings && siblings.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5">
              {siblings.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < idx
                      ? "bg-primary"
                      : i === idx
                        ? "bg-accent"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Video */}
          {embedUrl && (
            <section className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                <PlayCircle className="h-3.5 w-3.5" /> Watch
              </div>
              <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-black"
                   style={{ aspectRatio: "16/9" }}>
                <iframe
                  src={embedUrl}
                  title={lesson.title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Lesson text — paginated, swipeable */}
          <ReadPager text={lesson.text_content || "Content coming soon."} />


          {/* Equations */}
          {equations.length > 0 && (
            <section className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sigma className="h-3.5 w-3.5" /> Formulas
              </div>
              <div className="space-y-2">
                {equations.map((eq, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-primary/30 bg-primary/5 p-4"
                  >
                    {eq.label && (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {eq.label}
                      </div>
                    )}
                    <div
                      className="mt-1 text-center text-lg font-semibold tracking-wide text-primary"
                      style={{ fontFamily: '"Cambria Math", "Latin Modern Math", Georgia, serif' }}
                    >
                      {eq.formula}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key points */}
          {keyPoints.length > 0 && (
            <section className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                <Lightbulb className="h-3.5 w-3.5" /> Key Takeaways
              </div>
              <ul className="space-y-2 rounded-2xl border border-border bg-card/60 p-4">
                {keyPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Bottom navigation */}
          <div className="mt-8 flex items-center justify-center gap-3">
            {prev ? (
              <Link
                to="/lessons/$id"
                params={{ id: prev.id }}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Link>
            ) : (
              <Link
                to="/modules/$id"
                params={{ id: lesson.module_id }}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Link>
            )}
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Trophy className="h-3.5 w-3.5" />
              Assessment
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {progress?.completed && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              ✓ You already completed this lesson
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ReadPager({ text }: { text: string }) {
  // Split into paragraphs, group into pages so each page fits without inner scroll.
  const pages = useMemo(() => {
    const paras = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paras.length === 0) return [text];

    // Aim ~420 chars per page (~roughly fits the fixed-height card on mobile).
    const TARGET = 420;
    const out: string[] = [];
    let buf = "";
    for (const p of paras) {
      if (!buf) {
        buf = p;
      } else if (buf.length + p.length + 2 <= TARGET) {
        buf += "\n\n" + p;
      } else {
        out.push(buf);
        buf = p;
      }
    }
    if (buf) out.push(buf);
    return out;
  }, [text]);

  const [page, setPage] = useState(0);
  const total = pages.length;
  const touchStartX = useRef<number | null>(null);

  const go = (delta: number) => {
    setPage((p) => Math.min(total - 1, Math.max(0, p + delta)));
  };

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <BookOpen className="h-3.5 w-3.5" /> Read
        </div>
        {total > 1 && (
          <div className="text-[10px] font-semibold text-muted-foreground">
            {page + 1} / {total}
          </div>
        )}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card/60"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        <article
          key={page}
          className="min-h-[340px] whitespace-pre-wrap p-5 text-sm leading-relaxed text-foreground/90 animate-in fade-in slide-in-from-right-2 duration-200"
        >
          {pages[page]}
        </article>

        {total > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-opacity disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>

            <div className="flex items-center gap-1.5">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === page ? "w-4 bg-primary" : "w-1.5 bg-muted"
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              disabled={page === total - 1}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-opacity disabled:opacity-30"
              aria-label="Next page"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

