import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ChevronLeft } from "lucide-react";
import logo from "@/assets/funphy-logo.png";
import { useForceLight } from "@/hooks/use-force-light";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

type View = "welcome" | "signin" | "signup";

function LoginPage() {
  useForceLight();
  const nav = useNavigate();
  const [view, setView] = useState<View>("welcome");
  const [busy, setBusy] = useState(false);

  // signin
  const [siEmail, setSiEmail] = useState("");
  const [siPwd, setSiPwd] = useState("");
  const [siSchool, setSiSchool] = useState("");

  // signup
  const [suEmail, setSuEmail] = useState("");
  const [suUser, setSuUser] = useState("");
  const [suSchool, setSuSchool] = useState("");
  const [suProfCode, setSuProfCode] = useState("");
  const [suPwd, setSuPwd] = useState("");
  const [suPwd2, setSuPwd2] = useState("");
  const [remember, setRemember] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPwd });
      if (error) throw error;
      const { data: prof } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", data.user.id)
        .maybeSingle();
      // Only enforce school ID match when the profile already has one saved
      // AND the user entered one. Otherwise allow sign-in (profile may still
      // be initializing right after signup).
      const savedSchool = (prof?.school_id ?? "").trim();
      const enteredSchool = siSchool.trim();
      if (savedSchool && enteredSchool && savedSchool !== enteredSchool) {
        await supabase.auth.signOut();
        throw new Error("School ID does not match this account.");
      }
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPwd !== suPwd2) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      // Validate professor code exists
      const code = suProfCode.trim();
      if (code) {
        const { data: ok, error: rpcErr } = await supabase.rpc("professor_code_exists", { _code: code });
        if (rpcErr) throw rpcErr;
        if (!ok) throw new Error("Professor code not found. Ask your professor for the correct code.");
      }
      const { error } = await supabase.auth.signUp({
        email: suEmail,
        password: suPwd,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: {
            display_name: suUser,
            school_id: suSchool,
            linked_professor_code: code || null,
          },
        },
      });
      if (error) throw error;
      toast.success("Account created!");
      nav({ to: "/placement" });
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
      <div className="relative z-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {view === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center text-center"
            >
              <img src={logo} alt="FUNPHY" className="h-24 w-24 drop-shadow-lg" />
              <h1 className="mt-4 text-5xl font-black tracking-tight">Hello!</h1>
              <p className="mt-2 text-base italic text-muted-foreground">
                Let's start your Physics Journey
              </p>

              <div className="mt-10 w-full space-y-3">
                <button
                  onClick={() => setView("signin")}
                  className="w-full rounded-full border-2 border-primary bg-white px-6 py-3.5 text-base font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Log In
                </button>
                <button
                  onClick={() => setView("signup")}
                  className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
                >
                  Sign Up
                </button>
              </div>

              <button
                onClick={() => nav({ to: "/admin-login" })}
                className="mt-5 text-[13px] text-muted-foreground underline underline-offset-2 hover:text-primary"
              >
                Are you a Professor or Admin? Admin Login →
              </button>
            </motion.div>
          )}

          {view === "signin" && (
            <motion.form
              key="signin"
              onSubmit={signIn}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="light rounded-3xl border border-[hsl(214_32%_91%)] bg-white p-7 text-slate-900 shadow-xl backdrop-blur"
            >
              <div className="mb-4 flex flex-col items-center">
                <img src={logo} alt="FUNPHY" className="h-14 w-14" />
                <span className="mt-1 text-lg font-black tracking-tight text-slate-900">FUNPHY</span>
              </div>
              <button
                type="button"
                onClick={() => setView("welcome")}
                className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-center text-2xl font-black italic">Welcome back! User</h2>

              <label className="mt-6 block text-sm font-bold">Username</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              <label className="mt-4 block text-sm font-bold">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={siPwd}
                onChange={(e) => setSiPwd(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              <label className="mt-4 block text-sm font-bold">School ID</label>
              <input
                type="text"
                required
                value={siSchool}
                onChange={(e) => setSiSchool(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-2 flex justify-end">
                <button type="button" className="text-xs text-muted-foreground hover:text-primary">
                  Forgot Password?
                </button>
              </div>

              <button
                disabled={busy}
                className="mx-auto mt-5 block rounded-full border-2 border-primary bg-white px-10 py-2.5 font-bold text-primary hover:bg-primary hover:text-white disabled:opacity-50"
              >
                {busy ? "..." : "Log In"}
              </button>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("signup")}
                  className="font-bold text-primary underline"
                >
                  SIGN UP
                </button>
              </p>
            </motion.form>
          )}

          {view === "signup" && (
            <motion.form
              key="signup"
              onSubmit={signUp}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="light rounded-3xl border border-[hsl(214_32%_91%)] bg-white p-7 text-slate-900 shadow-xl backdrop-blur"
            >
              <div className="mb-4 flex flex-col items-center">
                <img src={logo} alt="FUNPHY" className="h-14 w-14" />
                <span className="mt-1 text-lg font-black tracking-tight text-slate-900">FUNPHY</span>
              </div>
              <button
                type="button"
                onClick={() => setView("welcome")}
                className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-center text-2xl font-black">Create an Account</h2>

              {[
                { label: "Email", v: suEmail, set: setSuEmail, type: "email" },
                { label: "Username", v: suUser, set: setSuUser, type: "text" },
                { label: "School ID", v: suSchool, set: setSuSchool, type: "text" },
                { label: "Professor Code", v: suProfCode, set: setSuProfCode, type: "text" },
                { label: "Password", v: suPwd, set: setSuPwd, type: "password" },
                { label: "Re-enter Password", v: suPwd2, set: setSuPwd2, type: "password" },
              ].map((f) => (
                <div key={f.label} className="mt-3">
                  <label className="block text-sm font-bold">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    minLength={f.type === "password" ? 6 : undefined}
                    value={f.v}
                    onChange={(e) => f.set(e.target.value)}
                    className="mt-1.5 w-full rounded-full border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}

              <div className="mt-4 flex items-center justify-between">
                <button
                  disabled={busy}
                  className="rounded-full bg-primary px-8 py-2.5 font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50"
                >
                  {busy ? "..." : "Sign Up"}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Remember Me
                </label>
              </div>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("signin")}
                  className="font-bold text-primary underline"
                >
                  LOG IN
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          © Batch 2026 AP4 Group 11 | All rights reserved
        </p>
      </div>
    </div>
  );
}
