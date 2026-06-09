import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  xp: number;
  streak: number;
  max_streak: number;
  hearts: number;
  gems: number;
  physics_score: number;
  league: string;
  current_module_id: string | null;
  placement_completed: boolean;
  avatar_url?: string | null;
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Profile;

      const { data: created, error: createError } = await supabase.rpc("ensure_profile", {
        _display_name: user!.user_metadata?.display_name ?? null,
        _school_id: user!.user_metadata?.school_id ?? null,
        _linked_professor_code: user!.user_metadata?.linked_professor_code ?? null,
      });
      if (createError) throw createError;
      return created as Profile;
    },
  });
}

export function useRefreshProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => qc.invalidateQueries({ queryKey: ["profile", user?.id] });
}
