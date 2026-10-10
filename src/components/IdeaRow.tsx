"use client";

import { IDEA_DRAG } from "@/lib/drag";
import { STATUS_META } from "@/lib/theme";
import type { Idea } from "@/lib/types";

/** One idea in a list. Frozen is the default state, so only other states get a badge. */
export function IdeaRow({ idea, subtitle, onOpen }: { idea: Idea; subtitle?: string; onOpen: () => void }) {
  const meta = STATUS_META[idea.status];
  const finished = idea.status === "served" || idea.status === "melted";
  const detail = subtitle ?? (idea.tags.length ? idea.tags.map((t) => `#${t}`).join(" ") : undefined);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(IDEA_DRAG, idea.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/50 focus-visible:bg-white/60 focus-visible:outline-none active:bg-white/70 dark:hover:bg-white/5 dark:active:bg-white/10"
    >
      <div className={`min-w-0 flex-1 ${finished ? "opacity-60" : ""}`}>
        <p
          className={`line-clamp-2 text-[15px] leading-snug text-slate-800 dark:text-slate-100 ${idea.status === "melted" ? "line-through decoration-slate-400" : ""}`}
        >
          {idea.title}
        </p>
        {idea.notes && (
          <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{idea.notes.split("\n")[0]}</p>
        )}
        {detail && <p className="mt-0.5 truncate text-xs text-sky-700/70 dark:text-sky-300/60">{detail}</p>}
      </div>
      {idea.status !== "frozen" && (
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}>
          {meta.label}
        </span>
      )}
    </div>
  );
}
