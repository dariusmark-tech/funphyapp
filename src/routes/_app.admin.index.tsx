import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarClock, Target } from "lucide-react";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<Date>(today);

  const year = view.y;
  const month = view.m;
  const monthName = new Date(year, month, 1).toLocaleString("en-US", { month: "long" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const prevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: total }, { count: active }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("last_active_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
      ]);
      return { total: total ?? 0, active: active ?? 0 };
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="grid h-7 w-7 place-items-center rounded-full hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-xs font-bold italic text-slate-700">Calendar</p>
            <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
              {monthName} {year}
            </h2>
          </div>
          <button
            onClick={nextMonth}
            className="grid h-7 w-7 place-items-center rounded-full hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-600">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
          {cells.map((d, i) => {
            const cellDate = d ? new Date(year, month, d) : null;
            const isToday = cellDate && sameDay(cellDate, today);
            const isSelected = cellDate && sameDay(cellDate, selected);
            return (
              <button
                key={i}
                disabled={!d}
                onClick={() => cellDate && setSelected(cellDate)}
                className={`aspect-square grid place-items-center rounded-md transition ${
                  isSelected
                    ? "bg-[var(--neon)] font-black text-white"
                    : isToday
                      ? "ring-2 ring-[var(--neon)] font-bold text-slate-900"
                      : d
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-transparent"
                }`}
              >
                {d ?? "·"}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-black text-slate-900">
            {selected.toLocaleDateString("en-US", { weekday: "long", day: "2-digit" })}
          </p>
          <p className="text-xs font-bold uppercase text-slate-700">
            {selected.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Registered Users" value={stats?.total ?? "—"} />
        <Stat label="Active (7d)" value={stats?.active ?? "—"} />
      </div>

      <Assignments selectedDate={selected} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-black text-[var(--neon)]">{value}</div>
    </div>
  );
}

function Assignments({ selectedDate }: { selectedDate: Date }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetXp, setTargetXp] = useState(50);

  const { data: myCode } = useQuery({
    queryKey: ["my-prof-code"],
    queryFn: async () => {
      const { data } = await supabase.rpc("my_professor_code");
      return (data as string | null) ?? "";
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments", myCode],
    enabled: !!myCode,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("deadline_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !myCode) throw new Error("Not ready");
      const deadline = selectedDate.toISOString().slice(0, 10);
      const { error } = await supabase.from("assignments").insert({
        title: title.trim() || `XP Goal: ${targetXp}`,
        target_xp: targetXp,
        deadline_date: deadline,
        professor_code: myCode,
        created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setTargetXp(50);
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600">Assignments</p>
          <h3 className="text-sm font-black text-slate-900">XP Goals & Deadlines</h3>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-[var(--neon)] px-3 py-1.5 text-[11px] font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] text-slate-600">
            Deadline: <b>{selectedDate.toLocaleDateString()}</b> (tap a date on the calendar to change)
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title (e.g. Week 1 XP Goal)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[var(--neon)]"
          />
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-700">Target XP:</label>
            <input
              type="number"
              min={1}
              value={targetXp}
              onChange={(e) => setTargetXp(parseInt(e.target.value || "0", 10))}
              className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-[var(--neon)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1 text-[11px] font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !targetXp}
              className="rounded-full bg-[var(--neon)] px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Create"}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {assignments?.length ? (
          assignments.map((a) => {
            const overdue = new Date(a.deadline_date) < new Date(new Date().toDateString());
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-[var(--neon)]/15 text-[var(--neon)]">
                  <Target className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{a.title}</p>
                  <p className="flex items-center gap-1 text-[10px] text-slate-600">
                    <CalendarClock className="h-3 w-3" />
                    {new Date(a.deadline_date).toLocaleDateString()} · {a.target_xp} XP
                    {overdue && <span className="ml-1 font-bold text-rose-600">· past</span>}
                  </p>
                </div>
                <button
                  onClick={() => remove.mutate(a.id)}
                  className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })
        ) : (
          <li className="py-4 text-center text-[11px] text-slate-500">
            No assignments yet. Pick a deadline date and tap New.
          </li>
        )}
      </ul>
    </div>
  );
}
