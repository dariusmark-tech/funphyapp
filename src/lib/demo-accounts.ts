import { supabase } from "@/integrations/supabase/client";

export type DemoRole = "student" | "professor";

export const DEMO_ACCOUNTS: Record<
  DemoRole,
  {
    email: string;
    password: string;
    displayName: string;
    schoolId: string;
    professorCode?: string;
    linkedProfessorCode?: string;
  }
> = {
  student: {
    email: "demo.student@funphy.app",
    password: "Funphy2026!",
    displayName: "Demo Student",
    schoolId: "STU-0001",
    linkedProfessorCode: "PROF-DEMO",
  },
  professor: {
    email: "demo.professor@funphy.app",
    password: "Funphy2026!",
    displayName: "Demo Professor",
    schoolId: "PROF-0001",
    professorCode: "PROF-DEMO",
  },
};

export const ADMIN_INVITE_CODE = "FUNPHY-ADMIN-2026";

/**
 * Sign in with the given credentials. If the account doesn't exist yet, create it
 * (using the provided metadata), then sign in. Idempotent — safe to call repeatedly.
 */
export async function signInOrCreate(opts: {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
  emailRedirectTo?: string;
}) {
  const { email, password, metadata, emailRedirectTo } = opts;
  const first = await supabase.auth.signInWithPassword({ email, password });
  if (!first.error) return first.data;

  const msg = (first.error.message || "").toLowerCase();
  const looksMissing =
    msg.includes("invalid login") ||
    msg.includes("invalid credentials") ||
    msg.includes("email not confirmed");

  if (!looksMissing) throw first.error;

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata, emailRedirectTo },
  });
  if (signUp.error && !signUp.error.message.toLowerCase().includes("already")) {
    throw signUp.error;
  }
  const second = await supabase.auth.signInWithPassword({ email, password });
  if (second.error) throw second.error;
  return second.data;
}

export async function loginDemoStudent() {
  const a = DEMO_ACCOUNTS.student;
  await signInOrCreate({
    email: a.email,
    password: a.password,
    metadata: {
      display_name: a.displayName,
      school_id: a.schoolId,
      linked_professor_code: a.linkedProfessorCode,
    },
    emailRedirectTo: window.location.origin + "/dashboard",
  });
  await supabase.rpc("ensure_profile", {
    _display_name: a.displayName,
    _school_id: a.schoolId,
    _linked_professor_code: a.linkedProfessorCode ?? null,
  });
}

export async function loginDemoProfessor() {
  const a = DEMO_ACCOUNTS.professor;
  await signInOrCreate({
    email: a.email,
    password: a.password,
    metadata: {
      display_name: a.displayName,
      school_id: a.schoolId,
    },
    emailRedirectTo: window.location.origin + "/admin",
  });
  // Promote to admin (professor) — idempotent
  await supabase.rpc("grant_admin_role", {
    _invite_code: ADMIN_INVITE_CODE,
    _school_id: a.schoolId,
    _professor_code: a.professorCode ?? null,
  });
}
