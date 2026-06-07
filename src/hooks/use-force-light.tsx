import { useEffect } from "react";

/**
 * Forces the document into light mode while the component is mounted.
 * Restores the previous `dark` class state on unmount so user theme
 * preference is preserved on other screens.
 */
export function useForceLight() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);
}
