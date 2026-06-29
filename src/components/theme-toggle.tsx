"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "segmented";
}

/**
 * Theme toggle.
 *
 * - `icon` (default): single button that cycles light → dark → system,
 *   showing the current effective theme icon.
 * - `segmented`: small 3-segment control with explicit Light / Dark /
 *   System options. Better discoverable on first visit.
 */
export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch — render a stable placeholder until mounted.
  React.useEffect(() => setMounted(true), []);

  if (variant === "segmented") {
    return (
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5",
          "dark:border-zinc-700 dark:bg-zinc-900",
          className
        )}
      >
        <SegmentedItem
          active={mounted && theme === "light"}
          onClick={() => setTheme("light")}
          label="Light"
          icon={<Sun className="h-3.5 w-3.5" />}
        />
        <SegmentedItem
          active={mounted && theme === "dark"}
          onClick={() => setTheme("dark")}
          label="Dark"
          icon={<Moon className="h-3.5 w-3.5" />}
        />
        <SegmentedItem
          active={mounted && theme === "system"}
          onClick={() => setTheme("system")}
          label="Auto"
          icon={<Monitor className="h-3.5 w-3.5" />}
        />
      </div>
    );
  }

  // Icon variant — dropdown menu for explicit choice
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5 px-2", className)}
          aria-label="Toggle theme"
        >
          {!mounted ? (
            <Sun className="h-3.5 w-3.5" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline text-xs">
            {!mounted ? "Theme" : resolvedTheme === "dark" ? "Dark" : "Light"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
          <Sun className="h-3.5 w-3.5" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
          <Moon className="h-3.5 w-3.5" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
          <Monitor className="h-3.5 w-3.5" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SegmentedItemProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function SegmentedItem({ active, onClick, label, icon }: SegmentedItemProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition",
        "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
        active && "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
