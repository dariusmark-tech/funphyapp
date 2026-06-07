import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Settings = {
  appearance: "dark" | "light";
  notifications: boolean;
  sounds: boolean;
};

type Ctx = Settings & {
  setAppearance: (v: "dark" | "light") => void;
  setNotifications: (v: boolean) => void;
  setSounds: (v: boolean) => void;
  playBeep: () => void;
  notify: (title: string, body?: string) => void;
};

const SettingsContext = createContext<Ctx | null>(null);
const KEY = "funphy.settings.v1";

const DEFAULTS: Settings = { appearance: "dark", notifications: true, sounds: true };

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    setS(load());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", s.appearance === "dark");
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  const value: Ctx = {
    ...s,
    setAppearance: (appearance) => setS((p) => ({ ...p, appearance })),
    setNotifications: (notifications) => {
      setS((p) => ({ ...p, notifications }));
      if (notifications && typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") Notification.requestPermission();
      }
    },
    setSounds: (sounds) => setS((p) => ({ ...p, sounds })),
    playBeep: () => {
      if (!s.sounds || typeof window === "undefined") return;
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        o.type = "sine";
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        o.start();
        o.stop(ctx.currentTime + 0.2);
      } catch {}
    },
    notify: (title, body) => {
      if (!s.notifications) return;
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try { new Notification(title, { body }); } catch {}
      }
    },
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
