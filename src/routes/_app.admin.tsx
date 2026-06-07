import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) throw redirect({ to: "/login" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", s.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-4 py-6 text-foreground">
      <p className="text-xs uppercase tracking-wider text-[var(--neon)]">Admin</p>
      <h1 className="text-2xl font-black">Welcome Admin</h1>
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
