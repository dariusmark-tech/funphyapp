import { useRef, useState } from "react";
import { Camera, Check, Sparkles, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRefreshProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export const PRESET_AVATARS = [
  "🧑‍🚀", "🧑‍🔬", "🧑‍🎓", "🦸", "🧙", "🧝",
  "🐱", "🦊", "🐼", "🐸", "🦄", "🤖",
];

export function getAvatarDisplay(profile?: { avatar_url?: string | null; display_name?: string | null }) {
  if (!profile) return { kind: "emoji" as const, value: "🧑‍🚀" };
  const a = profile.avatar_url;
  if (a?.startsWith("data:") || a?.startsWith("http")) {
    return { kind: "image" as const, value: a };
  }
  if (a && a.length <= 8) return { kind: "emoji" as const, value: a };
  const idx = (profile.display_name?.charCodeAt(0) ?? 0) % PRESET_AVATARS.length;
  return { kind: "emoji" as const, value: PRESET_AVATARS[idx] };
}

export function AvatarBubble({
  profile, size = 80, ring = true,
}: { profile?: any; size?: number; ring?: boolean }) {
  const a = getAvatarDisplay(profile);
  const ringCls = ring ? "ring-2 ring-[var(--neon)]/50" : "";
  if (a.kind === "image") {
    return (
      <img
        src={a.value}
        alt="avatar"
        className={`rounded-full object-cover ${ringCls}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`grid place-items-center rounded-full bg-gradient-to-br from-[var(--neon)]/20 to-[var(--cyan)]/20 ${ringCls}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {a.value}
    </div>
  );
}

export function AvatarPicker({
  trigger, profile,
}: { trigger: React.ReactNode; profile: any }) {
  const { user } = useAuth();
  const refresh = useRefreshProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  const save = async (value: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: value }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Could not save avatar", { description: error.message });
    refresh();
    toast.success("Avatar updated");
    setOpen(false);
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please pick an image under 1.5 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Square crop + resize to 256
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const cvs = document.createElement("canvas");
        cvs.width = 256; cvs.height = 256;
        const ctx = cvs.getContext("2d")!;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
        const dataUrl = cvs.toDataURL("image/jpeg", 0.82);
        save(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--neon)]" /> Change Avatar
          </DialogTitle>
        </DialogHeader>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Choose a preset</p>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {PRESET_AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelected(emoji)}
                className={`relative grid aspect-square place-items-center rounded-xl bg-secondary text-2xl transition ${
                  selected === emoji ? "ring-2 ring-[var(--neon)]" : "hover:bg-secondary/70"
                }`}
              >
                {emoji}
                {selected === emoji && (
                  <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[var(--neon)] p-0.5 text-primary-foreground" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => save(selected)}
            disabled={!selected || saving}
            className="mt-3 w-full rounded-full bg-[var(--neon)] px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preset avatar"}
          </button>
        </div>

        <div className="my-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Upload your photo</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-bold"
          >
            <Camera className="h-4 w-4" /> <Upload className="h-4 w-4" /> Choose photo
          </button>
          <p className="mt-1 text-[10px] text-muted-foreground">Auto-cropped to a square. Max 1.5 MB.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
