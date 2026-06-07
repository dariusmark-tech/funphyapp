import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Rocket, Zap, Battery, Target, RotateCw } from "lucide-react";

export const Route = createFileRoute("/_app/learning/")({
  component: ModulesList,
});

const ICONS: Record<string, any> = { rocket: Rocket, zap: Zap, battery: Battery, target: Target, "rotate-cw": RotateCw };

function ModulesList() {
  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").order("order_index");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-3">
      {modules?.map((m) => {
        const Icon = ICONS[m.icon || "rocket"] || Rocket;
        return (
          <Link
            key={m.id}
            to="/modules/$id"
            params={{ id: m.id }}
            className="glass flex items-center gap-3 rounded-2xl p-4 hover:border-[var(--neon)]/60"
          >
            <div
              className="grid h-12 w-12 place-items-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${m.color}30, ${m.color}10)`,
                border: `1px solid ${m.color}50`,
              }}
            >
              <Icon className="h-5 w-5" style={{ color: m.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Unit {m.order_index}</div>
              <h3 className="truncate font-bold">{m.title}</h3>
              <p className="truncate text-xs text-muted-foreground">{m.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
