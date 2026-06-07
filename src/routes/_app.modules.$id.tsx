import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Play, ChevronLeft, BookOpen, CheckCircle2, Lock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/modules/$id")({
  component: ModuleDetail,
});

function ModuleDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user } = useAuth();

  const { data: mod } = useQuery({
    queryKey: ["module", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: lessons } = useQuery({
    queryKey: ["lessons", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", id)
        .order("order_index");
      if (error) throw error;
      return data;
    },
  });
  const { data: progress } = useQuery({
    queryKey: ["module-progress", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("lesson_id, completed, posttest_passed")
        .eq("user_id", user!.id)
        .eq("module_id", id);
      return {
        completed: new Set((data ?? []).filter((p) => p.completed).map((p) => p.lesson_id)),
        passed: new Set((data ?? []).filter((p) => p.posttest_passed).map((p) => p.lesson_id)),
      };
    },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <button
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      {mod && (
        <div className="mt-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Module {mod.order_index}
          </span>
          <h1 className="text-3xl font-black leading-tight">{mod.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        {lessons?.map((l, i) => {
          const done = progress?.completed.has(l.id);
          const prev = i > 0 ? lessons[i - 1] : null;
          const locked = i > 0 && !(prev && progress?.passed.has(prev.id));

          const inner = (
            <>
              <motion.div
                animate={locked ? {} : { y: [0, -2, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.12 }}
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={{
                  background: locked
                    ? "color-mix(in oklab, var(--muted) 40%, transparent)"
                    : done
                      ? "color-mix(in oklab, var(--primary) 15%, transparent)"
                      : "color-mix(in oklab, var(--accent) 12%, transparent)",
                  border: `1px solid ${
                    locked
                      ? "color-mix(in oklab, var(--muted-foreground) 25%, transparent)"
                      : done
                        ? "var(--primary)"
                        : "color-mix(in oklab, var(--accent) 35%, transparent)"
                  }`,
                }}
              >
                {locked ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : done ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <BookOpen className="h-5 w-5 text-accent" />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Lesson {i + 1}
                </div>
                <h3 className={`truncate font-bold ${locked ? "text-muted-foreground" : ""}`}>
                  {l.title}
                </h3>
              </div>
              {locked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground ${done ? "" : "animate-pulse-glow"}`}>
                  {done ? <Play className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {done ? "Review" : "Start"}
                </span>
              )}
            </>
          );

          return locked ? (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass flex cursor-not-allowed items-center gap-3 rounded-2xl p-4"
              title="Pass the previous lesson's assessment to unlock"
            >
              {inner}
            </motion.div>
          ) : (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to="/lessons/$id"
                params={{ id: l.id }}
                className="glass flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/60"
              >
                {inner}
              </Link>
            </motion.div>
          );
        })}
        {lessons && lessons.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            More lessons coming soon for this module.
          </div>
        )}
      </div>
    </div>
  );
}
