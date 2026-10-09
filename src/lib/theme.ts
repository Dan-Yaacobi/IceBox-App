import type { ColorKey, Status } from "./types";

// Full class strings live here so Tailwind can see them at build time.
export const COLORS: Record<
  ColorKey,
  { label: string; dot: string; chip: string; stripe: string }
> = {
  ice: {
    label: "Ice",
    dot: "bg-sky-400",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
    stripe: "border-l-sky-400",
  },
  glacier: {
    label: "Glacier",
    dot: "bg-cyan-400",
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-200",
    stripe: "border-l-cyan-400",
  },
  mint: {
    label: "Mint",
    dot: "bg-emerald-400",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
    stripe: "border-l-emerald-400",
  },
  aurora: {
    label: "Aurora",
    dot: "bg-indigo-400",
    chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-200",
    stripe: "border-l-indigo-400",
  },
  lavender: {
    label: "Lavender",
    dot: "bg-violet-400",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
    stripe: "border-l-violet-400",
  },
  berry: {
    label: "Berry",
    dot: "bg-pink-400",
    chip: "bg-pink-100 text-pink-800 dark:bg-pink-400/15 dark:text-pink-200",
    stripe: "border-l-pink-400",
  },
  popsicle: {
    label: "Popsicle",
    dot: "bg-amber-400",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    stripe: "border-l-amber-400",
  },
  slate: {
    label: "Slate",
    dot: "bg-slate-400",
    chip: "bg-slate-200 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200",
    stripe: "border-l-slate-400",
  },
};

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

export const STATUSES: Status[] = ["frozen", "thawing", "served", "melted"];

export const STATUS_META: Record<
  Status,
  { label: string; emoji: string; hint: string; chip: string }
> = {
  frozen: {
    label: "Frozen",
    emoji: "🧊",
    hint: "On ice — an idea for later",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
  },
  thawing: {
    label: "Thawing",
    emoji: "🌡️",
    hint: "Taken out — working on it",
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-200",
  },
  served: {
    label: "Served",
    emoji: "🍨",
    hint: "Done — implemented",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
  melted: {
    label: "Melted",
    emoji: "💧",
    hint: "Dropped — not doing it",
    chip: "bg-slate-200 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  },
};

/** Next status when clicking the status chip on a card. */
export const NEXT_STATUS: Record<Status, Status> = {
  frozen: "thawing",
  thawing: "served",
  served: "frozen",
  melted: "frozen",
};
