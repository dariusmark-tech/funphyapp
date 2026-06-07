import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Heart } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/practice")({
  component: Practice,
});

function Practice() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-3">
        <Dumbbell className="h-6 w-6 text-[var(--neon)]" />
        <h1 className="text-3xl font-black">Practice Hub</h1>
      </div>
      <p className="mt-1 text-muted-foreground">Replay lessons and games. No XP, but you'll restore hearts.</p>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-[var(--heart)]">
            <Heart className="h-5 w-5" fill="currentColor" />
            <h3 className="font-bold">Restore a heart</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Complete a quick practice round to refill 1 heart.</p>
          <button className="mt-4 rounded-full bg-[var(--heart)]/90 px-4 py-2 text-sm font-bold text-white">
            Start practice round
          </button>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold">Mistake history</h3>
          <p className="mt-2 text-sm text-muted-foreground">Your last 5 incorrect answers will appear here as you learn.</p>
        </div>
      </motion.div>
    </div>
  );
}
