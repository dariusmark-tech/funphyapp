import { Heart, Flame, Zap, Gem, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function StatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex items-center gap-2 rounded-full px-4 py-2"
    >
      <span style={{ color }}>{icon}</span>
      <span className="font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </motion.div>
  );
}

export function HeartsDisplay({ count }: { count: number }) {
  return (
    <div className="glass flex items-center gap-1 rounded-full px-3 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Heart
          key={i}
          className="h-4 w-4"
          fill={i < count ? "var(--color-heart)" : "transparent"}
          stroke="var(--color-heart)"
        />
      ))}
    </div>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <StatPill
      icon={<Flame className="h-4 w-4" />}
      value={streak}
      label="day streak"
      color="var(--color-streak)"
    />
  );
}

export function XpBadge({ xp }: { xp: number }) {
  return (
    <StatPill
      icon={<Zap className="h-4 w-4" />}
      value={xp.toLocaleString()}
      label="XP"
      color="var(--color-xp)"
    />
  );
}

export function GemBadge({ gems }: { gems: number }) {
  return (
    <StatPill
      icon={<Gem className="h-4 w-4" />}
      value={gems}
      color="var(--color-gem)"
    />
  );
}

export function LeagueBadge({ league }: { league: string }) {
  const tone: Record<string, string> = {
    Bronze: "#CD7F32",
    Silver: "#C0C0C0",
    Gold: "#FFD700",
    Diamond: "#B9F2FF",
  };
  return (
    <StatPill
      icon={<Trophy className="h-4 w-4" />}
      value={league}
      color={tone[league] ?? "var(--color-neon)"}
    />
  );
}
