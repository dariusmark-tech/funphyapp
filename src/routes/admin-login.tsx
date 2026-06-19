import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/funphy-logo.png";
import { useForceLight } from "@/hooks/use-force-light";
import { DEMO_ACCOUNTS, loginDemoProfessor } from "@/lib/demo-accounts";

export const Route = createFileRoute("/admin-login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (role) throw redirect({ to: "/admin" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  useForceLight();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (error) throw new Error(error.message || "Invalid admin credentials. Please try again.");
      // Ensure profile row exists (uses school_id from user_metadata if available)
      await supabase.rpc("ensure_profile", {
        _school_id: schoolId,
      });
      const { data: prof } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", data.user.id)
        .maybeSingle();
      const profSchool = (prof?.school_id ?? "").trim();
      const metaSchool = ((data.user.user_metadata as any)?.school_id ?? "").trim();
      const entered = schoolId.trim();
      const ok = !entered || !profSchool || entered === profSchool || entered === metaSchool;
      if (!ok) {
        await supabase.auth.signOut();
        throw new Error("School ID does not match this account.");
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        throw new Error("This account is not an admin.");
      }
      nav({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="light relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-[#EEF2FF] to-[#E0E7FF] px-6 text-slate-900">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <Toaster />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="light relative z-10 w-full max-w-sm rounded-3xl border border-[hsl(214_32%_91%)] bg-white p-7 text-slate-900 shadow-xl"
      >
        <div className="mb-4 flex flex-col items-center">
          <img src={logo} alt="FUNPHY" className="h-14 w-14" />
          <span className="mt-1 text-lg font-black tracking-tight">FUNPHY</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Admin Portal</span>
        </div>
        <Link to="/login" className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <h2 className="text-center text-2xl font-black italic">Welcome back, Admin</h2>

        <label className="mt-6 block text-sm font-bold">Email</label>
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <label className="mt-4 block text-sm font-bold">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <label className="mt-4 block text-sm font-bold">Prof School ID <span className="text-xs font-normal text-slate-500">(optional)</span></label>
        <input
          type="text"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <button
          disabled={busy}
          className="mx-auto mt-6 block rounded-full border-2 border-primary bg-white px-10 py-2.5 font-bold text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          {busy ? "..." : "Log In"}
        </button>

        <div className="mt-4 rounded-2xl bg-primary/5 p-3 text-xs text-slate-700">
          <p className="font-bold text-primary">Demo professor account</p>
          <p className="mt-0.5 text-[11px] text-slate-600">
            {DEMO_ACCOUNTS.professor.email} · {DEMO_ACCOUNTS.professor.password}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await loginDemoProfessor();
                toast.success("Signed in as demo professor");
                nav({ to: "/admin" });
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setBusy(false);
              }
            }}
            className="mt-2 w-full rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            Use demo professor
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          Need an admin account?{" "}
          <Link to="/admin-signup" className="font-bold text-primary underline">
            SIGN UP
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          Are you a student?{" "}
          <Link to="/login" className="font-bold text-primary underline">
            LOG IN
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
