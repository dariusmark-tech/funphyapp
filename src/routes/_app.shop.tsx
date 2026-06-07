import { createFileRoute } from "@tanstack/react-router";
import { useProfile, useRefreshProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Snowflake, Timer, Sparkles, Gem } from "lucide-react";
import { toast } from "sonner";

const ITEMS = [
  { key: "streak_freeze", title: "Streak Freeze", desc: "Protects your streak for one missed day.", price: 50, icon: Snowflake, color: "var(--cyan)" },
  { key: "timer_boost", title: "Timer Boost", desc: "+30s on your next quiz timer.", price: 30, icon: Timer, color: "var(--xp)" },
  { key: "rocket_skin", title: "Rocket Skin", desc: "Cosmetic skin for Kinematics Jump.", price: 80, icon: Sparkles, color: "var(--magenta)" },
];

export const Route = createFileRoute("/_app/shop")({
  component: Shop,
});

function Shop() {
  const { data: profile } = useProfile();
  const refresh = useRefreshProfile();

  const buy = async (item: typeof ITEMS[number]) => {
    if (!profile) return;
    if (profile.gems < item.price) {
      toast.error("Not enough gems");
      return;
    }
    const { error } = await supabase.from("transactions").insert({
      user_id: profile.id,
      item_type: item.key,
      gems_spent: item.price,
    });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ gems: profile.gems - item.price }).eq("id", profile.id);
    refresh();
    toast.success(`${item.title} purchased!`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Shop</h1>
          <p className="text-muted-foreground">Spend gems on power-ups and cosmetics.</p>
        </div>
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2 text-[var(--gem)]">
          <Gem className="h-4 w-4" />
          <span className="font-black tabular-nums">{profile?.gems ?? 0}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.key} className="glass rounded-2xl p-6">
            <div
              className="grid h-12 w-12 place-items-center rounded-xl"
              style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}50` }}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
            <button
              onClick={() => buy(item)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--neon)] px-4 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
            >
              <Gem className="h-3.5 w-3.5" /> {item.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
