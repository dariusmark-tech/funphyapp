import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/funphy-logo.png";
import { useForceLight } from "@/hooks/use-force-light";

export const Route = createFileRoute("/admin-signup")({
  component: AdminSignupPage,
});

function AdminSignupPage() {
  useForceLight();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [profCode, setProfCode] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd !== pwd2) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: pwd,
        options: {
          emailRedirectTo: window.location.origin + "/admin",
          data: { display_name: user, school_id: schoolId },
        },
      });
      if (error) throw error;
      // Try to sign in immediately so we can call grant_admin_role
      const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (siErr) {
        toast.success("Account created — confirm your email then log in to activate admin.");
        nav({ to: "/admin-login" });
        return;
      }
      const { data: ok, error: rpcErr } = await supabase.rpc("grant_admin_role", {
        _invite_code: code,
        _school_id: schoolId,
        _professor_code: profCode,
      });
      if (rpcErr) throw rpcErr;
      if (!ok) {
        await supabase.auth.signOut();
        throw new Error("Invalid invite code. Contact your system administrator.");
      }
      toast.success("Admin account created!");
      nav({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="light relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-[#EEF2FF] to-[#E0E7FF] px-6 py-10 text-slate-900">
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
        <Link to="/admin-login" className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary">
          <ChevronLeft className="h-3 w-3" /> Back
        </Link>
        <h2 className="text-center text-2xl font-black">Create Admin Account</h2>

        {[
          { label: "Email", v: email, set: setEmail, type: "email" },
          { label: "Username", v: user, set: setUser, type: "text" },
          { label: "Prof School ID", v: schoolId, set: setSchoolId, type: "text" },
          { label: "Professor Code (share with your students)", v: profCode, set: setProfCode, type: "text" },
          { label: "Password", v: pwd, set: setPwd, type: "password" },
          { label: "Re-enter Password", v: pwd2, set: setPwd2, type: "password" },
          { label: "Invite Code", v: code, set: setCode, type: "password" },
        ].map((f) => (
          <div key={f.label} className="mt-3">
            <label className="block text-sm font-bold">{f.label}</label>
            <input
              type={f.type}
              required
              minLength={f.type === "password" ? 6 : undefined}
              value={f.v}
              onChange={(e) => f.set(e.target.value)}
              className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}

        <button
          disabled={busy}
          className="mx-auto mt-5 block rounded-full bg-primary px-10 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          {busy ? "..." : "Sign Up"}
        </button>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link to="/admin-login" className="font-bold text-primary underline">
            LOG IN
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
