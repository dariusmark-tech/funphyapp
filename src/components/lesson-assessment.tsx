import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRefreshProfile } from "@/hooks/use-profile";
import { ArrowRight, CheckCircle2, ChevronLeft, RotateCw, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";

type Question = {
  id: string;
  question_text: string;
  choices: string[];
  correct_answer: string;
  order_index: number;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const normalize = (value: string) => value.trim().toLowerCase();

export function LessonAssessment({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const { user } = useAuth();
  const refresh = useRefreshProfile();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ correct: number; pct: number; passed: boolean } | null>(null);

  const { data: lesson } = useQuery({
    queryKey: ["lesson-mini", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, module_id, order_index")
        .eq("id", lessonId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["lesson-assessment", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, passing_score, questions(id, question_text, choices, correct_answer, order_index)")
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: siblings } = useQuery({
    queryKey: ["assessment-siblings", lesson?.module_id],
    enabled: !!lesson?.module_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, order_index")
        .eq("module_id", lesson!.module_id)
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
  });

  const questions: Question[] = useMemo(
    () =>
      ((quiz?.questions ?? []) as Question[])
        .slice()
        .sort((a, b) => a.order_index - b.order_index),
    [quiz],
  );

  const passing = quiz?.passing_score ?? 70;
  const total = questions.length;
  const current = questions[Math.min(step, Math.max(total - 1, 0))];
  const picked = current && answers[current.id] !== undefined ? answers[current.id] : null;
  const idx = siblings?.findIndex((s) => s.id === lessonId) ?? -1;
  const nextLesson = siblings && idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const isCorrectChoice = (question: Question, choiceIndex: number) =>
    normalize(question.choices[choiceIndex] ?? "") === normalize(question.correct_answer);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in before saving your assessment.");
      if (!lesson) throw new Error("Lesson is still loading. Please try again.");

      const correct = questions.reduce(
        (count, q) => count + (answers[q.id] !== undefined && isCorrectChoice(q, answers[q.id]) ? 1 : 0),
        0,
      );
      const pct = total ? Math.round((correct / total) * 100) : 0;
      const passed = pct >= passing;

      const { error: progressError } = await supabase.from("user_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lesson.id,
          module_id: lesson.module_id,
          completed: passed,
          completed_at: passed ? new Date().toISOString() : null,
          posttest_score: pct,
          posttest_passed: passed,
        },
        { onConflict: "user_id,lesson_id" } as any,
      );
      if (progressError) throw progressError;

      if (passed) {
        const { data: prof, error: profileReadError } = await supabase
          .from("profiles")
          .select("xp, gems")
          .eq("id", user.id)
          .single();
        if (profileReadError) throw profileReadError;

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ xp: (prof?.xp ?? 0) + 25, gems: (prof?.gems ?? 0) + 5 })
          .eq("id", user.id);
        if (profileUpdateError) throw profileUpdateError;
      }

      return { correct, pct, passed };
    },
    onSuccess: (res) => {
      setResult(res);
      if (res.passed) {
        toast.success("+25 XP · +5 Gems", { description: `Assessment passed with ${res.pct}%!` });
        refresh();
      } else {
        toast.error(`Score ${res.pct}%`, { description: `Need ${passing}% to pass.` });
      }
    },
    onError: (error) => {
      toast.error("Assessment could not be saved", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const choose = (choiceIndex: number) => {
    if (!current || picked !== null) return;
    setAnswers((prev) => ({ ...prev, [current.id]: choiceIndex }));
  };

  const handleNext = () => {
    if (picked === null) return;
    if (step < total - 1) setStep((s) => s + 1);
    else submit.mutate();
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
    setStep(0);
  };

  if (result) {
    const level = result.pct >= 90 ? "Advanced" : result.pct >= 70 ? "Intermediate" : "Beginner";
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border-2 border-border bg-card p-7 shadow-xl"
        >
          <h2 className="text-center text-2xl font-black italic">Assessment Results</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">{lesson?.title}</p>

          <div className="mt-5 space-y-2 rounded-2xl border-2 border-border bg-background/60 p-5 text-sm">
            <p>
              <span className="font-bold">Score:</span>{" "}
              <span className={result.passed ? "font-black text-primary" : "font-black text-destructive"}>
                {result.correct}/{total} ({result.pct}%)
              </span>
            </p>
            <p>
              <span className="font-bold">Level:</span> <span className="font-black text-primary">{level}</span>
            </p>
            <p>
              <span className="font-bold">Feedback:</span>{" "}
              <span className="text-muted-foreground">
                {result.passed
                  ? "Great work! You passed this assessment and unlocked the next lesson."
                  : `You need ${passing}% to pass. Review the lesson and try again.`}
              </span>
            </p>
            <p>
              <span className="font-bold">Recommended:</span>{" "}
              <span className="text-muted-foreground">
                {result.passed ? "Continue your course path." : "Re-read the formulas and key takeaways first."}
              </span>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold"
            >
              <RotateCw className="h-3.5 w-3.5" /> Retry
            </button>
            {result.passed ? (
              nextLesson ? (
                <button
                  onClick={() => navigate({ to: "/lessons/$id", params: { id: nextLesson.id } })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                >
                  Next Lesson <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Link
                  to="/modules/$id"
                  params={{ id: lesson!.module_id }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                >
                  Finish <CheckCircle2 className="h-3.5 w-3.5" />
                </Link>
              )
            ) : (
              <Link
                to="/lessons/$id"
                params={{ id: lessonId }}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
              >
                Review Lesson
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-4 pb-28">
      <button
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Trophy className="h-3 w-3" /> Assessment · {total || 10} items
      </div>
      <h1 className="mt-1 text-xl font-black leading-tight">Answer the following physics questions</h1>

      {quizLoading ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl border border-border bg-card/70" />
      ) : !quiz || total === 0 || !current ? (
        <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
          Assessment not available yet.
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-1.5">
            {questions.map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: i === step ? 1.15 : 1 }}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : i === step ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Question {step + 1} of {total}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              className="mt-4 rounded-3xl border-2 border-border bg-card p-6 shadow-xl"
            >
              <p className="text-sm font-bold leading-snug">
                {step + 1}. {current.question_text}
              </p>
              <div className="mt-4 space-y-2">
                {current.choices.map((choice, i) => {
                  const isPicked = picked === i;
                  const isCorrect = picked !== null && isCorrectChoice(current, i);
                  const isWrongPick = isPicked && !isCorrectChoice(current, i);
                  return (
                    <motion.button
                      key={`${current.id}-${choice}`}
                      type="button"
                      disabled={picked !== null}
                      onClick={() => choose(i)}
                      whileTap={{ scale: 0.98 }}
                      className={`flex w-full items-start gap-2 rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-medium transition-all ${
                        isCorrect
                          ? "border-primary bg-primary/10 text-primary"
                          : isWrongPick
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border bg-background hover:border-primary/60"
                      }`}
                    >
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-current text-[10px] font-black">
                        {LETTERS[i] ?? i + 1}
                      </span>
                      <span className="flex-1">{choice}</span>
                      {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      {isWrongPick && <XCircle className="h-4 w-4" />}
                    </motion.button>
                  );
                })}
              </div>

              <button
                disabled={picked === null || submit.isPending}
                onClick={handleNext}
                className="ml-auto mt-5 flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
              >
                {submit.isPending ? "Saving..." : step + 1 >= total ? "Finish" : "Next"}
                {!submit.isPending && <ArrowRight className="h-4 w-4" />}
              </button>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}