"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "~/lib/utils";

type Theme = "light" | "dark";

/**
 * Light/dark switch for the staff and manager portals.
 * The choice is saved on this device only (localStorage "tt-theme");
 * src/app/client/layout.tsx re-applies it before the next page paints.
 */
export function ThemeToggle({ className }: { className?: string }): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toggle = (): void => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("tt-theme", next);
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
    setTheme(next);
  };

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "border-input text-muted-foreground hover:text-foreground hover:border-primary focus-visible:ring-ring inline-flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-[18px]" strokeWidth={1.5} /> : <Moon className="size-[18px]" strokeWidth={1.5} />}
    </button>
  );
}
