import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/learning/notes")({
  component: NotesPage,
});

function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: notes } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("*").order("updated_at", { ascending: false }).limit(7);
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      if ((notes?.length ?? 0) >= 7) throw new Error("Max 7 notes");
      const { error } = await supabase.from("notes").insert({ user_id: user.id, title: "New note", content: "" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{notes?.length ?? 0} / 7 notes</p>
        <button
          onClick={() => add.mutate()}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--neon)] px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Plus className="h-3.5 w-3.5" /> Add note
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {notes?.map((n) => (
          <li key={n.id}>
            <NoteRow id={n.id} initialTitle={n.title} initialContent={n.content} onDelete={() => del.mutate(n.id)} />
          </li>
        ))}
        {notes && notes.length === 0 && (
          <li className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No notes yet. Tap “Add note” to start.
          </li>
        )}
      </ul>
    </div>
  );
}

function NoteRow({
  id,
  initialTitle,
  initialContent,
  onDelete,
}: {
  id: string;
  initialTitle: string;
  initialContent: string;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").update({ title, content, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Saved"),
  });
  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-transparent text-sm font-bold outline-none"
        />
        <button onClick={onDelete} className="rounded-full p-1.5 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Write your note…"
        className="mt-2 w-full resize-none rounded-lg border border-border bg-background/30 p-2 text-sm outline-none focus:border-[var(--neon)]/60"
      />
      <button
        onClick={() => save.mutate()}
        className="mt-2 w-full rounded-full bg-[var(--neon)]/15 py-1.5 text-xs font-bold text-[var(--neon)] hover:bg-[var(--neon)]/25"
      >
        Save
      </button>
    </div>
  );
}
